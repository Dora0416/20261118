let idleSheet; // 儲存角色靜止動作的精靈圖
let runSheet; // 儲存角色跑步動作的精靈圖
let backgroundImage; // 儲存背景圖片
let lightningSheet; // 儲存由上往下落下的閃電精靈圖
let explosionSheet; // 儲存閃電觸地後的爆炸精靈圖
let thunderSound; // 儲存打雷音效
let direction = 0; // 儲存移動方向，1為向右、-1為向左、0為靜止
let backgroundOffset = 0; // 儲存背景水平捲動位置
let characterOffsetX = 0; // 儲存角色相對畫布中央的水平偏移
let rightEdgeEffectActive = false; // 記錄右側背景停在邊界時是否循環播放特效
let rightEdgeEffectStartTime = 0; // 記錄右側邊界特效循環的起始時間
let idleFrame = 0; // 儲存目前播放的靜止動畫格數
let runFrame = 0; // 儲存目前播放的跑步動畫格數
let lastFrameTime = 0; // 儲存上次切換動畫格的時間
const idleFrameCount = 14; // 設定靜止精靈圖的總格數
const runFrameCount = 12; // 設定跑步精靈圖的總格數
const lightningFrameCount = 14; // 設定閃電精靈圖的總格數
const explosionFrameCount = 10; // 設定爆炸精靈圖的總格數
const lightningCycleCount = 3; // 設定閃電動畫的播放次數
const lightningCycleDuration = 1000; // 設定每次閃電動畫的播放時間為一秒
const explosionDuration = 1000; // 設定爆炸動畫的播放時間為一秒
const effectSequenceDuration = lightningCycleCount * lightningCycleDuration + explosionDuration; // 設定三次閃電與一次爆炸的循環總時間
const idleFrameInterval = 90; // 設定靜止動畫每格播放的毫秒數
const runFrameInterval = 65; // 設定跑步動畫每格播放的毫秒數
const backgroundSpeed = 5; // 設定背景每畫格移動的像素數
const characterSpeed = 5; // 設定角色每畫格移動的像素數

function preload() { // 在程式開始前載入所有圖片
  idleSheet = loadImage("1/stop/stop.png"); // 載入角色靜止精靈圖
  runSheet = loadImage("1/run/run.png"); // 載入角色跑步精靈圖
  backgroundImage = loadImage("bg/0.png.png"); // 載入目前資料夾中實際命名的背景圖片
  lightningSheet = loadImage("effect/1/effect_1.png"); // 載入閃電特效精靈圖
  explosionSheet = loadImage("effect/2/effect_2.png"); // 載入藍色爆炸特效精靈圖
  thunderSound = loadSound("audio/chrysalyn-clean-dramatic-lightning-crash-547378.mp3"); // 載入打雷音效
} // 結束圖片載入函式

function setup() { // 設定畫布與初始播放時間
  createCanvas(windowWidth, windowHeight); // 建立符合瀏覽器視窗大小的畫布
  imageMode(CORNER); // 使用圖片左上角作為繪製座標
  lastFrameTime = millis(); // 記錄動畫開始播放的時間
} // 結束畫布設定函式

function draw() { // 每畫格更新背景與角色動畫
  const now = millis(); // 取得目前時間以控制動畫播放速度
  if (direction !== 0) { // 判斷角色是否正在播放跑步動作
    updateWorldPosition(); // 先移動背景，到達背景邊界後再移動角色
    runFrame = advanceRunFrame(runFrame, now); // 依序播放跑步動畫並循環第五至第十二格
  } else { // 角色沒有移動時播放靜止動畫
    idleFrame = advanceIdleFrame(idleFrame, now); // 循環播放全部十四格靜止動畫
  } // 結束角色動作判斷
  drawScrollingBackground(); // 繪製目前位置與兩側相鄰的背景
  drawCharacter(); // 將角色固定繪製在畫布中央
  drawEffects(now); // 更新並繪製閃電與爆炸特效
} // 結束每畫格更新函式

function updateWorldPosition() { // 依目前方向移動背景或角色
  const characterAtCenter = Math.abs(characterOffsetX) < 0.1; // 判斷角色是否已回到畫布中央
  if (!characterAtCenter && Math.sign(characterOffsetX) !== direction) { // 反向移動時讓角色先朝中央靠攏
    characterOffsetX = moveToward(characterOffsetX, 0, characterSpeed); // 逐步將角色移回中央
    return; // 等角色回到中央後再捲動背景
  } // 結束角色回中央判斷
  if (direction > 0 && backgroundOffset > -width) { // 向右且背景尚未到最右側邊界時
    const previousOffset = backgroundOffset; // 記錄捲動前的位置以判斷是否剛抵達邊界
    backgroundOffset = Math.max(-width, backgroundOffset - backgroundSpeed); // 向左捲動背景並停在場景邊界
    if (previousOffset > -width && backgroundOffset === -width) { // 背景最右端剛好碰到視窗右側時
      startRightEdgeEffects(); // 在畫面右側四分之一處開始循環播放特效
    } // 結束背景抵達右側邊界判斷
  } else if (direction < 0 && backgroundOffset < width) { // 向左且背景尚未到最左側邊界時
    backgroundOffset = Math.min(width, backgroundOffset + backgroundSpeed); // 向右捲動背景並停在場景邊界
  } else { // 背景已到該方向的邊界時移動角色
    const currentFrameWidth = (direction !== 0 ? runSheet.width / runFrameCount : idleSheet.width / idleFrameCount) * getCharacterScale(); // 計算角色目前動畫格的顯示寬度
    const edgeOffset = Math.max(0, width / 2 - currentFrameWidth / 2); // 計算角色動畫格抵達畫布邊緣前可移動的距離
    characterOffsetX = constrain(characterOffsetX + direction * characterSpeed, -edgeOffset, edgeOffset); // 移動角色並在畫布邊緣停止
  } // 結束背景或角色移動判斷
} // 結束世界位置更新函式

function startRightEdgeEffects() { // 啟動右側背景邊界的循環特效
  rightEdgeEffectActive = true; // 啟用閃電與爆炸循環動畫
  rightEdgeEffectStartTime = millis(); // 記錄特效循環起始時間
  if (!thunderSound.isPlaying()) { // 音效尚未播放時
    thunderSound.setVolume(0.7); // 設定打雷音量
    thunderSound.loop(); // 循環播放打雷音效
  } // 結束音效播放判斷
} // 結束閃電特效啟動函式

function drawEffects(now) { // 依播放時間更新並繪製畫面特效
  if (!rightEdgeEffectActive) { // 右側背景不在邊界時不播放特效
    return; // 結束本次特效繪製
  } // 結束特效啟用判斷
  if (getRightEdgeEffectX() > width) { // 閃電落點已隨背景移出視窗右側時
    stopRightEdgeEffects(); // 停止循環特效與打雷音效
    return; // 結束本次特效繪製
  } // 結束背景位置判斷
  const elapsed = (now - rightEdgeEffectStartTime) % effectSequenceDuration; // 計算目前循環序列中的播放時間
  if (elapsed < lightningCycleCount * lightningCycleDuration) { // 三次閃電播放期間
    const frameInCycle = Math.floor((elapsed % lightningCycleDuration) / lightningCycleDuration * lightningFrameCount); // 計算目前一秒循環中的閃電格數
    drawLightningFrame(frameInCycle); // 繪製目前的閃電動畫格
  } else { // 三次閃電結束後播放爆炸動畫
    const explosionElapsed = elapsed - lightningCycleCount * lightningCycleDuration; // 計算爆炸動畫目前已播放的時間
    const frame = Math.floor(explosionElapsed / explosionDuration * explosionFrameCount); // 計算目前的爆炸動畫格數
    drawExplosionFrame(frame); // 繪製目前的爆炸動畫格
  } // 結束循環序列階段判斷
} // 結束特效更新與繪製函式

function getRightEdgeEffectX() { // 計算右側背景四分之一落點在畫面上的位置
  return backgroundOffset + width * 1.75; // 依背景捲動位置同步移動落點
} // 結束落點座標計算函式

function stopRightEdgeEffects() { // 停止右側邊界的循環特效與打雷音效
  rightEdgeEffectActive = false; // 停止閃電與爆炸動畫
  if (thunderSound.isPlaying()) { // 音效正在播放時
    thunderSound.stop(); // 立即停止打雷音效
  } // 結束音效停止判斷
} // 結束特效停止函式

function drawLightningFrame(frame) { // 將閃電動畫格由畫面頂端延伸至底端
  const frameWidth = lightningSheet.width / lightningFrameCount; // 依總寬計算每格閃電圖片的寬度
  const frameHeight = lightningSheet.height; // 取得每格閃電圖片的高度
  const drawHeight = height; // 將閃電等比例放大至畫布全高
  const drawWidth = frameWidth * drawHeight / frameHeight; // 依原始比例計算閃電顯示寬度
  const centerX = getRightEdgeEffectX(); // 將閃電中心固定在右側背景四分之一位置
  image(lightningSheet, centerX - drawWidth / 2, 0, drawWidth, drawHeight, frame * frameWidth, 0, frameWidth, frameHeight); // 繪製由上方延伸至地面的目前閃電格
} // 結束閃電動畫格繪製函式

function drawExplosionFrame(frame) { // 將爆炸動畫格繪製在閃電落地的位置
  const frameWidth = explosionSheet.width / explosionFrameCount; // 依總寬計算每格爆炸圖片的寬度
  const frameHeight = explosionSheet.height; // 取得每格爆炸圖片的高度
  const scaleFactor = Math.min(height * 0.45 / frameHeight, width * 0.7 / frameWidth); // 依畫布大小等比例縮放爆炸特效
  const drawWidth = frameWidth * scaleFactor; // 計算爆炸特效顯示寬度
  const drawHeight = frameHeight * scaleFactor; // 計算爆炸特效顯示高度
  const centerX = getRightEdgeEffectX(); // 將爆炸中心固定在閃電落點
  image(explosionSheet, centerX - drawWidth / 2, height - drawHeight, drawWidth, drawHeight, frame * frameWidth, 0, frameWidth, frameHeight); // 繪製貼齊地面的目前爆炸格
} // 結束爆炸動畫格繪製函式

function getCharacterScale() { // 依目前畫布大小取得角色等比例縮放倍率
  const largestFrameWidth = Math.max(idleSheet.width / idleFrameCount, runSheet.width / runFrameCount); // 取得兩種動作中較寬的單格
  const largestFrameHeight = Math.max(idleSheet.height, runSheet.height); // 取得兩種動作中較高的單格
  return Math.min(height * 0.52 / largestFrameHeight, width * 0.4 / largestFrameWidth); // 依畫布尺寸計算角色縮放比例
} // 結束角色縮放計算函式

function moveToward(value, target, amount) { // 讓角色每畫格朝目標位置靠近指定距離
  if (Math.abs(target - value) <= amount) { // 若剩餘距離小於單次移動距離
    return target; // 直接抵達目標位置避免超過中央
  } // 結束抵達目標判斷
  return value + Math.sign(target - value) * amount; // 朝目標方向移動指定距離
} // 結束漸進移動函式

function advanceIdleFrame(frame, now) { // 更新靜止動畫的播放格數
  if (now - lastFrameTime >= idleFrameInterval) { // 到達切換靜止動畫格的時間時
    lastFrameTime = now; // 更新上次切換動畫格的時間
    return (frame + 1) % idleFrameCount; // 前進一格並在第十四格後回到第一格
  } // 結束時間判斷
  return frame; // 未到切換時間時維持目前動畫格
} // 結束靜止動畫更新函式

function advanceRunFrame(frame, now) { // 更新跑步動畫的播放格數
  if (now - lastFrameTime >= runFrameInterval) { // 到達切換跑步動畫格的時間時
    lastFrameTime = now; // 更新上次切換動畫格的時間
    return frame < runFrameCount - 1 ? frame + 1 : 4; // 首輪播放第一至十二格，之後循環第五至十二格
  } // 結束時間判斷
  return frame; // 未到切換時間時維持目前動畫格
} // 結束跑步動畫更新函式

function drawScrollingBackground() { // 繪製可無縫循環的三張背景
  const imageAspect = backgroundImage.width / backgroundImage.height; // 計算背景圖片的原始長寬比例
  const canvasAspect = width / height; // 計算目前畫布的長寬比例
  let sourceX = 0; // 設定背景裁切區域的水平起點
  let sourceY = 0; // 設定背景裁切區域的垂直起點
  let sourceWidth = backgroundImage.width; // 預設使用背景圖片的完整寬度
  let sourceHeight = backgroundImage.height; // 預設使用背景圖片的完整高度
  if (imageAspect > canvasAspect) { // 背景較寬時裁切左右兩側以滿版
    sourceWidth = backgroundImage.height * canvasAspect; // 依畫布比例計算裁切後的背景寬度
    sourceX = (backgroundImage.width - sourceWidth) / 2; // 將裁切範圍置於背景圖片中央
  } else { // 背景較高時裁切上下兩側以滿版
    sourceHeight = backgroundImage.width / canvasAspect; // 依畫布比例計算裁切後的背景高度
    sourceY = (backgroundImage.height - sourceHeight) / 2; // 將裁切範圍置於背景圖片中央
  } // 結束背景比例判斷
  image(backgroundImage, backgroundOffset - width, 0, width, height, sourceX, sourceY, sourceWidth, sourceHeight); // 繪製畫布左側的滿版背景
  image(backgroundImage, backgroundOffset, 0, width, height, sourceX, sourceY, sourceWidth, sourceHeight); // 繪製目前位置的滿版背景
  image(backgroundImage, backgroundOffset + width, 0, width, height, sourceX, sourceY, sourceWidth, sourceHeight); // 繪製畫布右側的滿版背景
} // 結束背景繪製函式

function drawCharacter() { // 將目前角色動畫格繪製於畫布中央
  const isRunning = direction !== 0; // 判斷要使用靜止或跑步精靈圖
  const sheet = isRunning ? runSheet : idleSheet; // 選擇目前動作所需的精靈圖
  const frameCount = isRunning ? runFrameCount : idleFrameCount; // 取得精靈圖的總格數
  const frame = isRunning ? runFrame : idleFrame; // 取得目前需要繪製的動畫格
  const frameWidth = sheet.width / frameCount; // 依精靈圖總寬計算單格寬度
  const frameHeight = sheet.height; // 以精靈圖高度作為單格高度
  const characterScale = getCharacterScale(); // 取得依畫布大小計算的角色縮放倍率
  const drawWidth = frameWidth * characterScale; // 計算角色目前動畫格的顯示寬度
  const drawHeight = frameHeight * characterScale; // 計算角色目前動畫格的顯示高度
  const drawX = (width - drawWidth) / 2 + characterOffsetX; // 計算角色依移動偏移後的水平座標
  const drawY = height - drawHeight; // 將角色底部對齊畫布底部
  push(); // 暫存畫布狀態以免影響背景
  if (direction < 0) { // 向左時將角色水平翻轉
    translate(width, 0); // 將座標原點移至畫布右側
    scale(-1, 1); // 反轉水平繪圖方向
    image(sheet, width - drawX - drawWidth, drawY, drawWidth, drawHeight, frame * frameWidth, 0, frameWidth, frameHeight); // 繪製向左放大的目前動畫格
  } else { // 向右或靜止時保持角色原本朝向
    image(sheet, drawX, drawY, drawWidth, drawHeight, frame * frameWidth, 0, frameWidth, frameHeight); // 繪製放大的目前動畫格
  } // 結束角色朝向判斷
  pop(); // 還原畫布狀態
} // 結束角色繪製函式

function windowResized() { // 瀏覽器視窗尺寸改變時重新調整畫布
  resizeCanvas(windowWidth, windowHeight); // 讓畫布持續符合目前視窗大小
  backgroundOffset = constrain(backgroundOffset, -width, width); // 依新畫布寬度限制背景捲動範圍
  const frameWidth = (direction !== 0 ? runSheet.width / runFrameCount : idleSheet.width / idleFrameCount) * getCharacterScale(); // 計算目前角色動畫格的顯示寬度
  const edgeOffset = Math.max(0, width / 2 - frameWidth / 2); // 計算角色在新畫布中可移動的最大偏移
  characterOffsetX = constrain(characterOffsetX, -edgeOffset, edgeOffset); // 避免調整視窗後角色超出畫布
} // 結束視窗尺寸調整函式

function keyPressed() { // 按下左右方向鍵時開始對應的跑步動作
  if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) { // 使用者操作方向鍵時
    userStartAudio(); // 解鎖瀏覽器音訊播放權限
  } // 結束音訊權限解鎖判斷
  if (keyCode === RIGHT_ARROW && direction !== 1) { // 判斷是否開始向右
    direction = 1; // 設定向右跑步並使背景向左移動
    startRunAnimation(); // 從跑步精靈圖第一格開始播放
  } else if (keyCode === LEFT_ARROW && direction !== -1) { // 判斷是否開始向左
    direction = -1; // 設定向左跑步並使背景向右移動
    startRunAnimation(); // 從跑步精靈圖第一格開始播放
  } // 結束方向鍵判斷
} // 結束按鍵按下事件

function keyReleased() { // 放開方向鍵時停止跑步並回到靜止動畫
  if (keyCode === RIGHT_ARROW && direction === 1) { // 判斷是否放開向右鍵
    direction = keyIsDown(LEFT_ARROW) ? -1 : 0; // 若左鍵仍按住則改向左，否則停止
    if (direction === -1) { // 若切換成向左跑步
      startRunAnimation(); // 重新從跑步精靈圖第一格播放
    } // 結束左向切換判斷
  } else if (keyCode === LEFT_ARROW && direction === -1) { // 判斷是否放開向左鍵
    direction = keyIsDown(RIGHT_ARROW) ? 1 : 0; // 若右鍵仍按住則改向右，否則停止
    if (direction === 1) { // 若切換成向右跑步
      startRunAnimation(); // 重新從跑步精靈圖第一格播放
    } // 結束右向切換判斷
  } // 結束按鍵放開判斷
} // 結束按鍵放開事件

function startRunAnimation() { // 開始新一輪跑步動畫
  runFrame = 0; // 讓跑步動畫從第一格開始播放
  lastFrameTime = millis(); // 重設切換動畫格的時間
} // 結束跑步動畫開始函式
