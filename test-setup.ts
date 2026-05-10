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
      measureText() { return { width: 0 } },
      putImageData() {},
      getImageData() { return { data: new Uint8ClampedArray(0) } },
    } as unknown as CanvasRenderingContext2D
  } as any
}
