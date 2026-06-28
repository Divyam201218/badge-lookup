class BadgeRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 500;
    this.canvas.height = 500;
  }

  async render(imageUrl, placeholders, values = {}, qrConfig = null, verifyUrl = "https://example.com/verify") {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 1. Draw Background
    const img = await this.loadImage(imageUrl);
    this.ctx.drawImage(img, 0, 0, 500, 500);

    // 2. Draw Placeholders
    placeholders.forEach(ph => {
      const text = values[ph.key] || ph.label || `[${ph.key}]`;
      
      this.ctx.font = `${ph.weight || 'normal'} ${ph.size || 20}px ${ph.font || 'Arial'}`;
      this.ctx.fillStyle = ph.color || '#000000';
      this.ctx.textAlign = ph.alignment || 'center';
      this.ctx.textBaseline = 'middle';

      this.ctx.fillText(text, ph.x, ph.y);
    });

    // 3. Draw QR Code - using toDataURL for guaranteed rendering
    if (qrConfig && qrConfig.size > 0 && window.QRCode) {
      try {
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { 
          width: parseInt(qrConfig.size), 
          margin: 0 
        });
        const qrImg = await this.loadImage(qrDataUrl);
        this.ctx.drawImage(qrImg, parseInt(qrConfig.x), parseInt(qrConfig.y));
      } catch (err) {
        console.error("QR Code rendering failed:", err);
      }
    }
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
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

window.BadgeRenderer = BadgeRenderer;
