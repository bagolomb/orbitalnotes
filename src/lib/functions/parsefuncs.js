export function parseForTags(content) {
    const tagPattern = /@([\w-]+)/g;
    const matches = [];
    let match;
  
    while ((match = tagPattern.exec(content)) !== null) {
      matches.push(match[1]);
    }
  
    return matches;
}

export function parseForLinks(content) {
    const linkPattern = /\[\[([^\]]+)\]\]/g;
    const matches = [];
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
        matches.push(match[1].trim());
    }

    return matches;
}
  
