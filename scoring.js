/* Shared scoring rule for browser results and GameBull integrations. */
(function(root){
 const VERSION='2026-10-15-v2';
 function calculate({removedTiles=0,cleared=0,lostLives=0}={}){
  for(const value of [removedTiles,cleared,lostLives])if(!Number.isSafeInteger(value)||value<0)throw new TypeError('Score counts must be non-negative integers');
  const tilePoints=removedTiles*10,clearPoints=cleared*300,lifePenalty=lostLives*100,rawScore=tilePoints+clearPoints-lifePenalty;
  return {scoringVersion:VERSION,tilePoints,clearPoints,lifePenalty,rawScore,score:Math.max(0,rawScore),zeroFloorAdjustment:Math.max(0,-rawScore)};
 }
 const api={VERSION,calculate};if(typeof module==='object'&&module.exports)module.exports=api;else root.TileScoring=api;
})(typeof window!=='undefined'?window:globalThis);
