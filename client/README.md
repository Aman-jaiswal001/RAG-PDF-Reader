# RAG PDF Assistant Frontend

React + Tailwind frontend for the provided Express RAG server.

## 1. Install

```bash
npm install
```

## 2. Start the frontend

```bash
npm run dev
```

The frontend runs on http://localhost:5173 and proxies `/ai` and `/upload` to `http://localhost:5000`.

## 3. Important backend note

Your current `server.js` has a function named `upload()`, but it reads only:

```js
const pdfPath = './dummy_data.pdf'
```

and there is no `/upload` API route. Therefore the PDF upload UI cannot actually upload/index a browser-selected PDF until the backend exposes an upload endpoint.

Add `multer`:

```bash
npm i multer
```

Then add this to `server.js`:

```js
import multer from "multer";

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  }
});

app.post("/upload", uploadMiddleware.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const pdfResult = new PDFParse({ data: req.file.buffer });
    const result = await pdfResult.getText();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });

    const docs = await splitter.createDocuments([result.text]);

    await vectorStore.addDocuments(docs);

    return res.status(200).json({
      message: "PDF uploaded and indexed successfully",
      chunks: docs.length
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to process PDF",
      error: error.message
    });
  }
});
```

Keep the existing `/ai` route for questions.

## 4. Small improvement to your `/ai` route

Your current response property is `"ai "` with a trailing space. It is better to change:

```js
return res.status(200).json({"ai ": response.content});
```

to:

```js
return res.status(200).json({ ai: response.content });
```

The frontend supports both forms, so it will work with your current response too.

## 5. CORS

You do not need CORS during local development because Vite proxies `/ai` and `/upload` to port 5000.

If you deploy frontend and backend on different domains, add CORS on the Express server:

```bash
npm i cors
```

```js
import cors from "cors";

app.use(cors({
  origin: "https://your-frontend-domain.com"
}));
```
