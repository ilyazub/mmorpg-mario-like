export default function DesktopControls() {
  return (
    <div className="hidden md:block mb-4 font-retro text-lg text-white no-select">
      <div className="flex justify-center space-x-8">
        <div>
          <span className="font-pixel text-coin-yellow">MOVE</span>: Arrow Keys / WASD
        </div>
        <div>
          <span className="font-pixel text-coin-yellow">JUMP</span>: Space / Up
        </div>
        <div>
          <span className="font-pixel text-coin-yellow">ACTION</span>: Z / X
        </div>
      </div>
    </div>
  );
}
