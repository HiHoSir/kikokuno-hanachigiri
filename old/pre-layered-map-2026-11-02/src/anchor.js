// Anchor proportions are normalized to the source image, not a fixed pixel standard.
export function anchorOffsetY(displayHeight,footPixelY,imageHeight){
 if(!Number.isFinite(displayHeight)||displayHeight<=0||!Number.isFinite(imageHeight)||imageHeight<=0||!Number.isFinite(footPixelY)||footPixelY<0||footPixelY>imageHeight)throw new RangeError('Invalid sprite anchor');
 return (imageHeight-footPixelY)/imageHeight*displayHeight;
}
