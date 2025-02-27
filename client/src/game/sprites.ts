export class Sprite {
  private image: HTMLImageElement;
  private loaded: boolean = false;
  public width: number;
  public height: number;

  constructor(src: string, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.image = new Image();
    this.image.src = src;
    this.image.onload = () => {
      this.loaded = true;
    };
  }

  public getImage(): HTMLImageElement {
    return this.image;
  }

  public isLoaded(): boolean {
    return this.loaded;
  }
}

export class SpriteSheet {
  private image: HTMLImageElement;
  private loaded: boolean = false;
  private tileWidth: number;
  private tileHeight: number;

  constructor(src: string, tileWidth: number, tileHeight: number) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.image = new Image();
    this.image.src = src;
    this.image.onload = () => {
      this.loaded = true;
    };
  }

  public getTileWidth(): number {
    return this.tileWidth;
  }

  public getTileHeight(): number {
    return this.tileHeight;
  }

  public drawTile(
    ctx: CanvasRenderingContext2D,
    tileId: number,
    x: number,
    y: number,
    width: number = this.tileWidth,
    height: number = this.tileHeight
  ): void {
    if (!this.loaded) return;

    const tilesPerRow = Math.floor(this.image.width / this.tileWidth);
    const row = Math.floor(tileId / tilesPerRow);
    const col = tileId % tilesPerRow;

    const sx = col * this.tileWidth;
    const sy = row * this.tileHeight;

    ctx.drawImage(
      this.image,
      sx,
      sy,
      this.tileWidth,
      this.tileHeight,
      x,
      y,
      width,
      height
    );
  }

  public isLoaded(): boolean {
    return this.loaded;
  }
}
