import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { initDatabase, db } from "./server/db";
import {
  authenticateUserCredentials,
  verifySession,
  requireAdminAuth,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
} from "./server/auth";
import { searchMediaMetadata } from "./server/media";
import { processEditorialDraft } from "./server/editorialAssistant";
import { automationController, validateAutomationSecret } from "./server/automationIntegration";
import { cloudinaryService } from "./server/services/cloudinaryService";
import { validateReviewInput } from "./server/utils/validation";
import { assertProductionDatabaseConfigured } from "./server/db/supabase";

async function startServer() {
  // Validate production infrastructure configuration if in production
  assertProductionDatabaseConfigured();

  // Initialize Database & File Stores
  initDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Static uploads directory
  const uploadsDir = path.join(process.cwd(), "data", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // Initialize Gemini API lazily for AI recommendations
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // ----------------------------------------------------
  // Health & System Info
  // ----------------------------------------------------
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ----------------------------------------------------
  // Authentication Endpoints
  // ----------------------------------------------------
  app.post("/api/auth/login", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
    const { emailOrUsername, password, keepSignedIn } = req.body;

    // Check rate limit
    const rateCheck = checkLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: "TooManyRequests",
        message: `Too many failed login attempts. Please wait ${rateCheck.waitSeconds} seconds before trying again.`,
      });
    }

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: "MissingCredentials", message: "Email and password are required." });
    }

    const authResult = await authenticateUserCredentials(emailOrUsername, password, Boolean(keepSignedIn));
    if (!authResult.success || !authResult.user || !authResult.token) {
      recordFailedLogin(ip);
      return res.status(401).json({
        error: "InvalidCredentials",
        message: authResult.error || "Invalid email or password.",
      });
    }

    // Success: clear rate limiting and return signed session token
    clearLoginAttempts(ip);

    res.json({
      success: true,
      token: authResult.token,
      user: authResult.user,
      authSource: authResult.authSource,
    });
  });

  app.get("/api/auth/session", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ authenticated: false });
    }
    const token = authHeader.split(" ")[1];
    const user = await verifySession(token);
    if (!user) {
      return res.status(401).json({ authenticated: false, message: "Session expired" });
    }
    res.json({
      authenticated: true,
      user,
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
  });

  // ----------------------------------------------------
  // Reviews API
  // ----------------------------------------------------
  app.get("/api/reviews", async (req, res) => {
    const authHeader = req.headers.authorization;
    let isAuthed = false;
    if (authHeader?.startsWith("Bearer ")) {
      const user = await verifySession(authHeader.split(" ")[1]);
      isAuthed = Boolean(user && user.role === "admin");
    }
    const includeDrafts = req.query.status === "all" && isAuthed;

    const reviews = db.getReviews(includeDrafts);
    res.json({ success: true, reviews, count: reviews.length });
  });

  app.get("/api/reviews/:id", (req, res) => {
    const review = db.getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "NotFound", message: "Review not found" });
    }
    res.json({ success: true, review });
  });

  app.post("/api/reviews", requireAdminAuth, (req, res) => {
    try {
      const reviewData = req.body;
      const validation = validateReviewInput(reviewData);
      if (!validation.valid) {
        return res.status(400).json({ error: "ValidationError", message: validation.errors[0]?.message, errors: validation.errors });
      }
      const created = db.createReview(reviewData);
      res.status(201).json({ success: true, review: created });
    } catch (err: any) {
      res.status(500).json({ error: "ServerError", message: err.message });
    }
  });

  app.put("/api/reviews/:id", requireAdminAuth, (req, res) => {
    try {
      const reviewData = req.body;
      reviewData.id = req.params.id;
      const validation = validateReviewInput(reviewData);
      if (!validation.valid) {
        return res.status(400).json({ error: "ValidationError", message: validation.errors[0]?.message, errors: validation.errors });
      }
      const updated = db.updateReview(reviewData);
      res.json({ success: true, review: updated });
    } catch (err: any) {
      res.status(500).json({ error: "ServerError", message: err.message });
    }
  });

  app.delete("/api/reviews/:id", requireAdminAuth, (req, res) => {
    try {
      const deleted = db.deleteReview(req.params.id);
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(500).json({ error: "ServerError", message: err.message });
    }
  });

  app.post("/api/reviews/:id/duplicate", requireAdminAuth, (req, res) => {
    try {
      const duplicated = db.duplicateReview(req.params.id);
      if (!duplicated) {
        return res.status(404).json({ error: "NotFound", message: "Review not found" });
      }
      res.status(201).json({ success: true, review: duplicated });
    } catch (err: any) {
      res.status(500).json({ error: "ServerError", message: err.message });
    }
  });

  // ----------------------------------------------------
  // Media Search & Metadata Fetcher
  // ----------------------------------------------------
  app.get("/api/media/search", requireAdminAuth, async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      const type = (req.query.type as string) || undefined;
      if (!query.trim()) {
        return res.json({ success: true, results: [] });
      }
      const results = await searchMediaMetadata(query, type);
      res.json({ success: true, results });
    } catch (err: any) {
      console.error("Media search error:", err);
      res.status(500).json({ error: "MediaSearchFailed", message: err.message });
    }
  });

  // ----------------------------------------------------
  // Recommendations Management API
  // ----------------------------------------------------
  app.get("/api/recommendations", (req, res) => {
    const lists = db.getRecommendationLists();
    res.json({ success: true, lists });
  });

  app.post("/api/recommendations", requireAdminAuth, (req, res) => {
    try {
      const listData = req.body;
      const saved = db.saveRecommendationList(listData);
      res.json({ success: true, list: saved });
    } catch (err: any) {
      res.status(500).json({ error: "ServerError", message: err.message });
    }
  });

  app.delete("/api/recommendations/:id", requireAdminAuth, (req, res) => {
    try {
      db.deleteRecommendationList(req.params.id);
      res.json({ success: true, message: "Recommendation list deleted" });
    } catch (err: any) {
      res.status(500).json({ error: "ServerError", message: err.message });
    }
  });

  // ----------------------------------------------------
  // What To Watch Next API
  // ----------------------------------------------------
  app.get("/api/what-to-watch-next", (req, res) => {
    const items = db.getWhatToWatchNext();
    res.json({ success: true, items });
  });

  app.post("/api/what-to-watch-next", requireAdminAuth, (req, res) => {
    try {
      const item = req.body;
      const saved = db.saveWhatToWatchNext(item);
      res.json({ success: true, item: saved });
    } catch (err: any) {
      res.status(500).json({ error: "ServerError", message: err.message });
    }
  });

  app.delete("/api/what-to-watch-next/:id", requireAdminAuth, (req, res) => {
    try {
      db.deleteWhatToWatchNext(req.params.id);
      res.json({ success: true, message: "Item deleted" });
    } catch (err: any) {
      res.status(500).json({ error: "ServerError", message: err.message });
    }
  });

  // ----------------------------------------------------
  // Comments Moderation API
  // ----------------------------------------------------
  app.get("/api/comments", async (req, res) => {
    const authHeader = req.headers.authorization;
    let isAuthed = false;
    if (authHeader?.startsWith("Bearer ")) {
      const user = await verifySession(authHeader.split(" ")[1]);
      isAuthed = Boolean(user && user.role === "admin");
    }

    const all = db.getComments();
    if (isAuthed) {
      return res.json({ success: true, comments: all });
    }
    // Public readers only get approved comments
    const approved = all.filter((c) => c.status === "approved" || !c.status);
    res.json({ success: true, comments: approved });
  });

  app.post("/api/comments", (req, res) => {
    const { reviewId, userName, content } = req.body;
    if (!reviewId || !userName || !content) {
      return res.status(400).json({ error: "MissingFields", message: "Review ID, name, and comment are required." });
    }
    const settings = db.getSettings();
    const comment = db.addComment({
      id: `comment-${Date.now()}`,
      reviewId,
      userName: userName.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      status: settings.autoApproveComments ? "approved" : "pending",
    });
    res.json({ success: true, comment, message: settings.autoApproveComments ? "Comment posted!" : "Comment submitted for moderation." });
  });

  app.put("/api/comments/:id/status", requireAdminAuth, (req, res) => {
    const { status } = req.body;
    if (!["approved", "pending", "hidden"].includes(status)) {
      return res.status(400).json({ error: "InvalidStatus" });
    }
    const updated = db.updateCommentStatus(req.params.id, status);
    res.json({ success: updated });
  });

  app.delete("/api/comments/:id", requireAdminAuth, (req, res) => {
    const deleted = db.deleteComment(req.params.id);
    res.json({ success: deleted });
  });

  // ----------------------------------------------------
  // Newsletter Subscribers API
  // ----------------------------------------------------
  app.get("/api/newsletter/subscribers", requireAdminAuth, (req, res) => {
    const subscribers = db.getSubscribers();
    res.json({ success: true, subscribers, count: subscribers.length });
  });

  app.post(["/api/newsletter/subscribe", "/api/subscribe"], (req, res) => {
    const { email, preference } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "InvalidEmail", message: "Please enter a valid email address." });
    }
    const { subscriber, isNew } = db.addSubscriber(email, preference);
    res.json({
      success: true,
      subscriber,
      message: isNew ? "Welcome to The Abstract Dispatch!" : "You are already subscribed to The Abstract Dispatch!",
    });
  });

  app.delete("/api/newsletter/subscribers/:id", requireAdminAuth, (req, res) => {
    db.removeSubscriber(req.params.id);
    res.json({ success: true, message: "Subscriber removed" });
  });

  app.get("/api/newsletter/export", requireAdminAuth, (req, res) => {
    const subscribers = db.getSubscribers();
    const headers = "ID,Email,SubscribedDate,Status,Preference\n";
    const rows = subscribers
      .map((s) => `"${s.id}","${s.email}","${s.subscribedAt}","${s.status}","${s.preference || "all"}"`)
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="abstract-dispatch-subscribers.csv"');
    res.send(headers + rows);
  });

  // ----------------------------------------------------
  // Site Settings & Tags API
  // ----------------------------------------------------
  app.get("/api/settings", (req, res) => {
    res.json({ success: true, settings: db.getSettings() });
  });

  app.put("/api/settings", requireAdminAuth, (req, res) => {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  });

  app.get("/api/tags", (req, res) => {
    res.json({ success: true, tags: db.getTags() });
  });

  app.post("/api/tags", requireAdminAuth, (req, res) => {
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: "MissingTag" });
    const tags = db.addTag(tag);
    res.json({ success: true, tags });
  });

  app.delete("/api/tags/:tag", requireAdminAuth, (req, res) => {
    const tags = db.deleteTag(decodeURIComponent(req.params.tag));
    res.json({ success: true, tags });
  });

  // ----------------------------------------------------
  // Analytics Summary API
  // ----------------------------------------------------
  app.get("/api/analytics", requireAdminAuth, (req, res) => {
    res.json({ success: true, analytics: db.getAnalyticsSummary() });
  });

  // ----------------------------------------------------
  // Image Upload API (Cloudinary CDN with local fallback)
  // ----------------------------------------------------
  app.post("/api/upload", requireAdminAuth, async (req, res) => {
    try {
      const { dataUrl, filename, folder } = req.body;
      if (!dataUrl || !dataUrl.includes(",")) {
        return res.status(400).json({ error: "InvalidDataUrl", message: "Image base64 data required" });
      }

      const result = await cloudinaryService.uploadBase64(
        dataUrl,
        filename || "upload",
        folder || "the-abstract-take/uploads"
      );

      res.json({
        success: true,
        url: result.url,
        publicId: result.publicId,
        filename: result.filename,
        provider: result.provider,
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "UploadFailed", message: err.message });
    }
  });

  // ----------------------------------------------------
  // Gemini AI Watch Recommendation API Endpoint
  // ----------------------------------------------------
  app.post("/api/recommend-ai", async (req, res) => {
    try {
      const { mood, favoriteFilms, mediaType, timeAvailable } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          success: true,
          curatorNote: "Tailored picks reflecting your personal taste profile and cinematic preferences.",
          recommendations: [
            {
              title: "Drive My Car (2021)",
              type: "Movie",
              year: "2021",
              director: "Ryusuke Hamaguchi",
              abstractScore: 98,
              summary: "A sublime, quiet masterpiece exploring grief, communication, and human resonance.",
              whyWatch: "Matches your contemplative mood with exquisite storytelling.",
            },
            {
              title: "Severance (Season 1)",
              type: "Series",
              year: "2022",
              director: "Ben Stiller",
              abstractScore: 94,
              summary: "A chilling, pristine neo-dystopian workplace thriller with flawless aesthetic design.",
              whyWatch: "Engaging corporate allegory packed with tension.",
            },
          ],
        });
      }

      const prompt = `You are "The Abstract Take" Cinema Editor & Curator providing personalized "Editor's Recommendation" watch picks. 
The Abstract Take is a high-profile, independent, editorial cinema and television review platform known for thoughtful, opinionated, artistic critique.

The user is asking for personalized watch recommendations based on these preferences:
- Mood/Vibe: ${mood || "Thoughtful & Atmospheric"}
- Favorite recent films/shows: ${favoriteFilms || "None specified"}
- Preferred Media: ${mediaType || "Any"}
- Available time: ${timeAvailable || "Flexible"}

Generate exactly 3 bespoke recommendations. Each recommendation MUST include:
1. title (e.g. "Past Lives (2023)")
2. type ("Movie", "Series", "Anime", "Documentary")
3. year (e.g. "2023")
4. director (e.g. "Celine Song")
5. abstractScore (an integer from 1 to 10 based on artistic merit on a 1-10 scale, e.g. 10 for Masterpiece, 9 for Brilliant, 8 for Great)
6. summary (a concise 2-sentence editorial overview in the voice of The Abstract Take)
7. whyWatch (1 sentence explaining why it specifically fits the user's input)

Respond ONLY in valid JSON matching this structure:
{
  "curatorNote": "Short 1-sentence note from The Abstract Take",
  "recommendations": [
    {
      "title": "...",
      "type": "...",
      "year": "...",
      "director": "...",
      "abstractScore": 9,
      "summary": "...",
      "whyWatch": "..."
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "";
      let jsonResponse;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonResponse = JSON.parse(jsonMatch[0]);
        } else {
          jsonResponse = JSON.parse(text);
        }
      } catch (parseErr) {
        jsonResponse = {
          curatorNote: "Here are curated picks tailored for your current aesthetic vibe.",
          recommendations: [
            {
              title: "Anatomy of a Fall (2023)",
              type: "Movie",
              year: "2023",
              director: "Justine Triet",
              abstractScore: 9,
              summary: "A sharp, multi-layered psychological courtroom drama examining truth and relationship dynamics.",
              whyWatch: "Captivating intellectual rigor and masterful acting.",
            },
          ],
        };
      }

      res.json({ success: true, ...jsonResponse });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: "Failed to generate recommendations", message: error.message });
    }
  });

  // AI Editorial Assistant API
  app.post("/api/ai/editorial-assistant", requireAdminAuth, async (req, res) => {
    try {
      const {
        title,
        year,
        contentType,
        rating,
        rawTake,
        likes,
        dislikes,
        personalVerdict,
        verifiedFacts,
        contextualBackground,
      } = req.body;

      if (!title && !rawTake) {
        return res.status(400).json({ error: "Missing required fields", message: "Title or raw notes are required." });
      }

      const result = await processEditorialDraft(
        {
          title: title || "Untitled Review",
          year,
          contentType: contentType || "Movie",
          rating: Number(rating) || 8,
          rawTake: rawTake || "",
          likes,
          dislikes,
          personalVerdict,
          verifiedFacts,
          contextualBackground,
        },
        getGeminiClient
      );

      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Editorial Assistant error:", error);
      res.status(500).json({ error: "Failed to generate editorial review", message: error.message });
    }
  });

  // Google Sheets Bulk Automation Endpoints
  app.get("/api/automation/health", validateAutomationSecret, (req, res) => automationController.checkHealth(req, res));
  app.get("/api/automation/template-spec", validateAutomationSecret, (req, res) => automationController.getTemplateSpec(req, res));
  app.post("/api/automation/generate", validateAutomationSecret, (req, res) => automationController.generateReview(req, res, getGeminiClient));
  app.post("/api/automation/publish", validateAutomationSecret, (req, res) => automationController.publishReview(req, res));
  app.post("/api/automation/batch-publish", validateAutomationSecret, (req, res) => automationController.batchPublish(req, res));

  // Contact API
  app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    res.json({ success: true, message: "Thank you for reaching out to The Abstract Take." });
  });

  // Vite Middleware in Dev vs Static in Prod
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Abstract Take server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
