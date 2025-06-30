export default function splitText(
    content,                     // string     - the full document
    chunkSize = 1024,         // number     - max characters per chunk
    chunkOverlap = 100        // number     - overlap between chunks
  ) /*: string[]*/ {
    const hierarchy = [
      /\n{2,}/g,             // 1) double-newline paragraphs
      /\n/g,                 // 2) single-newline lines
      /(?<=[.!?])\s+/g,      // 3) sentence boundaries (look-behind)
      /\s+/g                 // 4) fallback to words
    ];
  
    // Main recursive worker
    function recurse(str, level = 0) {
      if (str.length <= chunkSize || level === hierarchy.length) {
        return [str.trim()];
      }
  
      // Split on the current level’s delimiter
      const parts = str.split(hierarchy[level]);
  
      // Merge adjacent pieces until we hit chunkSize
      const chunks = [];
      let buf = "";
  
      for (let i = 0; i < parts.length; i++) {
        const piece = parts[i];
        // +1 for the space/newline we lost in split (except first piece)
        const glue = i === 0 ? "" : str.match(hierarchy[level])[0] || " ";
        if ((buf + glue + piece).length > chunkSize && buf) {
          chunks.push(buf.trim());
          buf = piece;       // start new buffer
        } else {
          buf += glue + piece;
        }
      }
      if (buf) chunks.push(buf.trim());
  
      // If pieces are still too big, dive deeper
      return chunks.flatMap(c => recurse(c, level + 1));
    }
  
    // Build initial chunks
    const rawChunks = recurse(content);
  
    // Add overlaps
    if (chunkOverlap <= 0) return rawChunks;
  
    const overlapped = [];
    for (let i = 0; i < rawChunks.length; i++) {
      const current = rawChunks[i];
      const prevTail = i > 0 ? rawChunks[i - 1].slice(-chunkOverlap) : "";
      overlapped.push((prevTail + current).slice(-chunkSize));
    }
    return overlapped;
  }