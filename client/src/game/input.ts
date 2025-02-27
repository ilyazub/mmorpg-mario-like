export class InputHandler {
  private keys: { [key: string]: boolean } = {};
  private touchControls: { [key: string]: boolean } = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    action: false
  };

  constructor() {
    // Set up keyboard event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys[e.code] = true;
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false;
  }

  // Touch control methods for mobile
  public setTouchControl(control: string, active: boolean): void {
    if (control in this.touchControls) {
      this.touchControls[control] = active;
    }
  }

  // Check movement keys
  public isLeft(): boolean {
    return (
      this.keys['ArrowLeft'] || 
      this.keys['KeyA'] || 
      this.touchControls.left
    );
  }

  public isRight(): boolean {
    return (
      this.keys['ArrowRight'] || 
      this.keys['KeyD'] || 
      this.touchControls.right
    );
  }

  public isUp(): boolean {
    return (
      this.keys['ArrowUp'] || 
      this.keys['KeyW'] || 
      this.touchControls.up
    );
  }

  public isDown(): boolean {
    return (
      this.keys['ArrowDown'] || 
      this.keys['KeyS'] || 
      this.touchControls.down
    );
  }

  // Check action keys
  public isJump(): boolean {
    return (
      this.keys['Space'] || 
      this.keys['ArrowUp'] || 
      this.keys['KeyW'] || 
      this.touchControls.jump
    );
  }

  public isAction(): boolean {
    return (
      this.keys['KeyZ'] || 
      this.keys['KeyX'] || 
      this.touchControls.action
    );
  }
}
