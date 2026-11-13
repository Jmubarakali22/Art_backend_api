const ImageKit = require('imagekit');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/baaidzoik';
const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
const defaultFolder = process.env.IMAGEKIT_DEFAULT_FOLDER || '/assets/gallery-full/test';

let imagekitInstance = null;

if (publicKey && privateKey) {
  try {
    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint
    });
    console.log('[ImageKit] Initialized successfully with endpoint:', urlEndpoint);
  } catch (err) {
    console.warn('[ImageKit Warning] Initialization failed:', err.message);
  }
}

/**
 * Check if ImageKit has active credentials configured
 */
function isConfigured() {
  return !!(imagekitInstance && privateKey && publicKey);
}

/**
 * Upload a file to ImageKit
 * @param {Object} file - Multer file object
 * @param {Object} options - Upload options (folder, fileName)
 */
async function uploadToImageKit(file, options = {}) {
  const folder = options.folder || defaultFolder;
  const fileName = options.fileName || file.originalname || `photo_${Date.now()}.png`;

  if (isConfigured()) {
    try {
      // Read file buffer from disk or memory
      const fileData = file.buffer || fs.readFileSync(file.path);
      const base64File = fileData.toString('base64');

      const response = await imagekitInstance.upload({
        file: base64File,
        fileName: fileName,
        folder: folder,
        useUniqueFileName: false
      });

      console.log(`[ImageKit] File successfully uploaded to ${folder}:`, response.url);
      return {
        success: true,
        url: response.url,
        fileId: response.fileId,
        name: response.name,
        filePath: response.filePath,
        folder: folder
      };
    } catch (error) {
      console.error('[ImageKit Error] Upload failed:', error.message);
      throw error;
    }
  } else {
    // When keys are not yet provided in .env, serve directly from local /uploads to prevent 404
    const localUrl = `http://localhost:5000/uploads/${file.filename}`;
    console.warn(`[ImageKit Notice] ImageKit API keys (IMAGEKIT_PRIVATE_KEY) not found in backend/.env.`);
    console.warn(`[ImageKit Notice] File safely saved locally and served at: ${localUrl}`);
    console.warn(`[ImageKit Tip] Add your ImageKit Private Key in backend/.env to push directly to https://ik.imagekit.io/baaidzoik${folder}`);

    return {
      success: true,
      url: localUrl,
      localUrl: localUrl,
      isSimulated: true,
      folder: folder
    };
  }
}

/**
 * Delete a file from ImageKit given its public URL
 * @param {string} imageUrl - The full ImageKit URL
 */
async function deleteFromImageKit(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  if (!imageUrl.includes('ik.imagekit.io')) {
    return false;
  }
  if (!isConfigured()) {
    console.warn('[ImageKit Warning] Delete skipped: ImageKit not configured');
    return false;
  }

  try {
    const parsed = new URL(imageUrl);
    let pathName = decodeURIComponent(parsed.pathname);

    // Remove endpoint ID prefix (e.g. '/baaidzoik') if present
    const epPath = new URL(urlEndpoint).pathname.replace(/\/+$/, '');
    if (epPath && pathName.startsWith(epPath)) {
      pathName = pathName.slice(epPath.length);
    }
    if (!pathName.startsWith('/')) pathName = '/' + pathName;

    const lastSlash = pathName.lastIndexOf('/');
    const fileName = lastSlash !== -1 ? pathName.slice(lastSlash + 1) : pathName;
    const folderPath = lastSlash !== -1 ? pathName.slice(0, lastSlash) : '/';

    console.log(`[ImageKit] Finding file to delete: "${fileName}" in folder: "${folderPath}"`);

    // 1. Search with folder and file name
    let files = await imagekitInstance.listFiles({
      searchQuery: `name = "${fileName}"`,
      path: folderPath
    });

    // 2. Fallback: search by name across folders if path didn't return matches
    if (!files || files.length === 0) {
      files = await imagekitInstance.listFiles({
        searchQuery: `name = "${fileName}"`
      });
    }

    if (files && files.length > 0) {
      const matched = files.find(f => f.filePath === pathName || f.name === fileName) || files[0];
      if (matched && matched.fileId) {
        await imagekitInstance.deleteFile(matched.fileId);
        console.log(`[ImageKit] Successfully deleted file: ${matched.filePath} (${matched.fileId})`);
        return true;
      }
    }

    console.warn(`[ImageKit] File "${fileName}" not found on ImageKit; nothing deleted.`);
    return false;
  } catch (error) {
    console.error('[ImageKit Error] Failed to delete file:', error.message);
    return false;
  }
}

module.exports = {
  isConfigured,
  uploadToImageKit,
  deleteFromImageKit,
  urlEndpoint,
  defaultFolder
};
