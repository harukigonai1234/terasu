// happy-dom doesn't implement CanvasRenderingContext2D.
// Patch HTMLCanvasElement.prototype.getContext to return a mock context.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (_type: string) {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineJoin: 'miter',
      globalAlpha: 1,
      fillRect() {},
      strokeRect() {},
      clearRect() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      fill() {},
      arc() {},
      closePath() {},
      rect() {},
      clip() {},
      save() {},
      restore() {},
      translate() {},
      rotate() {},
      scale() {},
      setTransform() {},
      drawImage() {},
      createLinearGradient() { return { addColorStop() {} } },
      createRadialGradient() { return { addColorStop() {} } },
      fillText() {},
      strokeText() {},
      measureText() { return { width: 0 } },
      putImageData() {},
      getImageData() { return { data: new Uint8ClampedArray(0) } },
      font: '11px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      lineCap: 'butt',
    } as unknown as CanvasRenderingContext2D
  } as any
}
