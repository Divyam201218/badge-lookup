class BadgeRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    // Ensure fixed 500x500 dimension as per spec
    this.canvas.width = 500;
    this.canvas.height = 500;
  }

  async render(imageUrl, placeholders, values = {}) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Load background image
    const img = await this.loadImage(imageUrl);
    this.ctx.drawImage(img, 0, 0, 500, 500);

    // Render each placeholder text
    placeholders.forEach(ph => {
      const text = values[ph.key] || ph.label || `[${ph.key}]`;
      
      this.ctx.font = `${ph.weight || 'normal'} ${ph.size || 20}px ${ph.font || 'Arial'}`;
      this.ctx.fillStyle = ph.color || '#000000';
      this.ctx.textAlign = ph.alignment || 'center';
      this.ctx.textBaseline = 'middle';

      this.ctx.fillText(text, ph.x, ph.y);
    });
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Crucial for CORS/Uploadcare
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  downloadPNG(filename = 'badge.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}

// Export for module usage or attach to window
window.BadgeRenderer = BadgeRenderer;
