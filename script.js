window.onload = function () {


  const canvas = document.getElementById('musicSheet');
  const ctx = canvas.getContext('2d');

  const applyRangeBtn = document.getElementById("apply_range");
  applyRangeBtn.addEventListener("click", drawMusicSheet, false);

  const LINE_SPACING = 16;
  const NOTE_WIDTH = 15;
  const NOTE_HEIGHT = 22;
  const NOTE_OFFSET_START = 80;
  let NOTE_OFFSET = NOTE_OFFSET_START;
  const STAFF_OFFSET = 50;
  const LINE_WIDTH = 2;

  let previousInvertedArea = { startX: null, width: null };//演奏中の音符を反転表示するためのメモリー

  //全部の音符の名前
  let noteOrder =
    ["E5", "Eb5", "D#5", "D5", "Db5", "C#5", "C5", "B4", "Bb4", "A#4", "A4", "Ab4", "G#4", "G4", "Gb4", "F#4",
      "F4", "E4", "Eb4", "D#4", "D4", "Db4", "C#4", "C4", "B3", "Bb3", "A#3", "A3", "Ab3", "G#3", "G3", "Gb3", "F#3",
      "F3", "E3", "Eb3", "D#3", "D3", "Db3", "C#3", "C3",
      "B2", "Bb2", "A#2", "A2", "Ab2", "G#2", "G2", "Gb2", "F#2", "F2", "E2"];
  //noteOrder内の音符の縦位置
  const noteIndexDic = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 7, 8, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 12, 13, 13, 14, 14, 15, 15, 15, 16, 16, 17, 17, 18, 18, 18,
    19, 19, 19, 20, 20, 21, 21,];

  const notes = {
    plane: ["E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3", "E3", "D3", "C3", "B2", "A2", "G2", "F2", "E2"]
    , sharp: ["E5", "D#5", "D5", "C#5", "C5", "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4", "B3", "A#3", "A3", "G#3", "G3", "F#3", "F3", "E3", "D#3", "D3", "C#3", "C3", "B2", "A#2", "A2", "G#2", "G2", "F#2", "F2", "E2"]
    , flat: ["E5", "Eb5", "D5", "Db5", "C5", "B4", "Bb4", "A4", "Ab4", "G4", "Gb4", "F4", "E4", "Eb4", "D4", "Db4", "C4", "B3", "Bb3", "A3", "Ab3", "G3", "Gb3", "F3", "E3", "Eb3", "D3", "Db3", "C3", "B2", "Bb2", "A2", "Ab2", "G2", "Gb2", "F2", "E2"]
  }


  let sequence = [];//音程シーケンスを入れる配列
  let planeSharpOrFlat = getSharpFlatOption;
  // 生成する音の範囲設定
  const minValueSldr = document.getElementById("minValue");
  const maxValueSldr = document.getElementById("maxValue");

  minValueSldr.min = 0;
  minValueSldr.max = 21;
  minValueSldr.value = 0;

  maxValueSldr.min = 0;
  maxValueSldr.max = 21;
  maxValueSldr.value = 21;

  minValueSldr.addEventListener("input", updateMinSlider);
  maxValueSldr.addEventListener("input", updateMaxSlider);

  // 最小値ラベル要素を取得する
  let minValueLabel = document.getElementById('min-value-label');

  // 最大値ラベル要素を取得する
  let maxValueLabel = document.getElementById('max-value-label');

  // 初期表示時にラベルを更新する
  updateLabels();
  drawMusicSheet();


  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");

  startBtn.addEventListener("click", function () {
    startMetronome(200);
  });
  stopBtn.addEventListener("click", function () {
    stopMetronome();
  });

  let octaveUp = false;
  const octaveUpBtn = document.getElementById("octaveUp");
  octaveUpBtn.addEventListener("change", function () {
    if (octaveUpBtn.checked) {
      console.log("チェックされています");
      octaveUp = true;
    } else {
      console.log("チェックされていません");
      octaveUp = false;
    }
  });



  function drawMusicSheet() {
    stopMetronome();
    clearCanvas();
    draw5lines();
    drawTrebleClef();
    planeSharpOrFlat = getSharpFlatOption();//#、bの有無を取得
    const noteRange = convertRangeToNoteOrderIndex(notes[planeSharpOrFlat]);//#、bの有無に合わせたインデックスの最大値と最小値を取得
    console.log(noteRange.max, noteRange.min);
    sequence = generateSequence(40, noteRange.max, noteRange.min);//取得したレンジの範囲で音のシーケンスを生成
    console.log("sequence:" + sequence);

    NOTE_OFFSET = NOTE_OFFSET_START
    // 生成したシーケンスを順番に描画
    for (const seq of sequence) {
      drawNote(notes[planeSharpOrFlat][seq]);
    }



    NOTE_OFFSET = NOTE_OFFSET_START;//reset offset for redraw
  }

  function draw5lines() {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = LINE_WIDTH;

    for (let i = -3; i <= 8; i++) {
      if (i >= 1 && i <= 5) {
        ctx.strokeStyle = 'black';
      } else {
        ctx.strokeStyle = 'white';
      };
      ctx.beginPath();
      ctx.moveTo(0, STAFF_OFFSET + (i * LINE_SPACING));
      ctx.lineTo(canvas.width, STAFF_OFFSET + (i * LINE_SPACING));
      ctx.stroke();
    }
  }

  function drawNote(note) {

    // const noteOrderAndIndex = [{ 'note': 'E5', 'pos': 0 }, { 'note': 'Eb5', 'pos': 0 }, { 'note': 'D#5', 'pos': 1 }, { 'note': 'D5', 'pos': 1 }, { 'note': 'Db5', 'pos': 1 }, { 'note': 'C#5', 'pos': 2 }, { 'note': 'C5', 'pos': 2 }, { 'note': 'B4', 'pos': 3 }, { 'note': 'Bb4', 'pos': 3 }, { 'note': 'A#4', 'pos': 4 }, { 'note': 'A4', 'pos': 4 }, { 'note': 'Ab4', 'pos': 4 }, { 'note': 'G#4', 'pos': 5 }, { 'note': 'G4', 'pos': 5 }, { 'note': 'Gb4', 'pos': 5 }, { 'note': 'F#4', 'pos': 6 }, { 'note': 'F4', 'pos': 6 }, { 'note': 'E4', 'pos': 7 }, { 'note': 'Eb4', 'pos': 7 }, { 'note': 'D#4', 'pos': 8 }, { 'note': 'D4', 'pos': 8 }, { 'note': 'Db4', 'pos': 8 }, { 'note': 'C#4', 'pos': 9 }, { 'note': 'C4', 'pos': 9 }, { 'note': 'B3', 'pos': 10 }, { 'note': 'Bb3', 'pos': 10 }, { 'note': 'A#3', 'pos': 11 }, { 'note': 'A3', 'pos': 11 }, { 'note': 'Ab3', 'pos': 11 }, { 'note': 'G#3', 'pos': 12 }, { 'note': 'G3', 'pos': 12 }, { 'note': 'Gb3', 'pos': 12 }, { 'note': 'F#3', 'pos': 13 }, { 'note': 'F3', 'pos': 13 }, { 'note': 'E3', 'pos': 14 }, { 'note': 'Eb3', 'pos': 14 }, { 'note': 'D#3', 'pos': 15 }, { 'note': 'D3', 'pos': 15 }, { 'note': 'Db3', 'pos': 15 }, { 'note': 'C#3', 'pos': 16 }, { 'note': 'C3', 'pos': 16 }, { 'note': 'B2', 'pos': 17 }, { 'note': 'Bb2', 'pos': 17 }, { 'note': 'A#2', 'pos': 18 }, { 'note': 'A2', 'pos': 18 }, { 'note': 'Ab2', 'pos': 18 }, { 'note': 'G#2', 'pos': 19 }, { 'note': 'G2', 'pos': 19 }, { 'note': 'Gb2', 'pos': 19 }, { 'note': 'F#2', 'pos': 20 }, { 'note': 'F2', 'pos': 20 }, { 'note': 'E2', 'pos': 21 }];

    const noteIndex = noteIndexDic[noteOrder.indexOf(note)];
    // const noteIndex = noteDic[note];

    let x = NOTE_OFFSET;
    const y = STAFF_OFFSET + (noteIndex - 4) * LINE_SPACING / 2;

    if (note.includes('#')) {
      x += 10;
      NOTE_OFFSET += 10;
      drawSharp(x - NOTE_HEIGHT, y);
    }
    if (note.includes('b')) {
      x += 10;
      NOTE_OFFSET += 10;
      drawFlat(x - NOTE_HEIGHT, y);
    }


    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(70 * Math.PI / 180);
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(0, 0, NOTE_WIDTH / 2, NOTE_HEIGHT / 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    //上側の補助線
    if (noteIndex <= 4) {
      ctx.strokeStyle = 'black';
      for (let i = STAFF_OFFSET; i >= y; i -= LINE_SPACING) {
        ctx.beginPath();
        ctx.moveTo(x - NOTE_WIDTH, i);
        ctx.lineTo(x + NOTE_WIDTH, i);
        ctx.stroke();
        // console.log(NOTE_OFFSET);
      }
    }

    //下側の補助線
    if (noteIndex >= 16) {
      ctx.strokeStyle = 'black';
      for (let i = STAFF_OFFSET + LINE_SPACING * 5; i <= y; i += LINE_SPACING) {
        ctx.beginPath();
        ctx.moveTo(x - NOTE_WIDTH, i);
        ctx.lineTo(x + NOTE_WIDTH, i);
        ctx.stroke();
        // console.log(NOTE_OFFSET);
      }
    }
    NOTE_OFFSET += NOTE_WIDTH * 2 + 10;


  }



  function drawTrebleClef(x, y) {

    // PNG画像の読み込み
    const pngImage = new Image();
    pngImage.src = "Treble_Clef.png";

    // 画像の読み込みが完了したら、Canvasに描画
    pngImage.onload = function () {
      // 画像の描画
      ctx.drawImage(pngImage, 5, 55, 40, 100);
    }
  }


  function drawSharp(x, y) {

    // PNG画像の読み込み
    const pngImage = new Image();
    pngImage.src = "sharp.png";

    // 画像の読み込みが完了したら、Canvasに描画
    pngImage.onload = function () {
      // 画像の描画
      ctx.drawImage(pngImage, x - 5, y - 14, 15, 30);
    }
  }
  function drawFlat(x, y) {

    // PNG画像の読み込み
    const pngImage = new Image();
    pngImage.src = "flat.png";

    // 画像の読み込みが完了したら、Canvasに描画
    pngImage.onload = function () {
      // 画像の描画
      ctx.drawImage(pngImage, x - 5, y - 20, 15, 30);
    }

  }

  function generateSequence(length = 40, minValue = 0, maxValue = 21) {
    // 初期化
    let sequence = [];
    let currentNum = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
    let isAscending = Math.random() >= 0.5;
    let consecutiveChanges = 0;

    // 数列を生成
    while (sequence.length < length) {
      sequence.push(currentNum);
      let changeDirection = false;
      if (consecutiveChanges >= 3) {
        // 3回以上連続して方向が変わった場合は、方向を強制的に反転させる
        changeDirection = true;
        consecutiveChanges = 0;
      } else {
        // 2種類のランダム関数を使用して、数列の方向を決定する
        let randomNum1 = Math.random();
        let randomNum2 = Math.random();
        if (isAscending && randomNum1 < randomNum2) {
          changeDirection = true;
        } else if (!isAscending && randomNum1 > randomNum2) {
          changeDirection = true;
        }
        // 最大値や最小値が連続する場合は、方向をランダムに変更する
        if (currentNum === minValue && !isAscending) {
          changeDirection = true;
        } else if (currentNum === maxValue && isAscending) {
          changeDirection = true;
        }
      }
      if (changeDirection) {
        isAscending = !isAscending;
        consecutiveChanges++;
      } else {
        consecutiveChanges = 0;
      }
      let nextNum = currentNum;
      let tryCount = 0;
      while (nextNum === currentNum && tryCount < 10) {
        // 同じ数字が続かないように、ランダムに数値を生成する
        if (isAscending) {
          nextNum = currentNum + Math.floor(Math.random() * 5) + 1;
        } else {
          nextNum = currentNum - Math.floor(Math.random() * 3) - 1;
        }
        // 最小値から最大値の範囲に収める
        nextNum = Math.max(minValue, Math.min(maxValue, nextNum));
        tryCount++;
      }
      currentNum = nextNum;
    }
    return sequence;
  }

  function clearCanvas() {
    ctx.fillStyle = 'white'; // fillStyleプロパティに白色を設定
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 全体を白く塗りつぶす
  }




  function updateMinSlider() {
    let minValue = parseInt(minValueSldr.value);
    let maxValue = parseInt(maxValueSldr.value);

    if (minValue >= maxValue - 1) {
      minValueSldr.value = maxValue - 1;
      minValue = maxValue - 1;
    }
    updateLabels();

  }

  function updateMaxSlider() {
    let minValue = parseInt(minValueSldr.value);
    let maxValue = parseInt(maxValueSldr.value);

    if (maxValue <= minValue + 1) {
      maxValueSldr.value = minValue + 1;
      maxValue = minValue + 1;
    }
    updateLabels();

  }

  function convertRangeToNoteOrderIndex(notes) {

    const minIndex = notes.findIndex(item => item === minValueLabel.textContent);
    const maxIndex = notes.findIndex(item => item === maxValueLabel.textContent);
    // console.log(minIndex, notes[minIndex], maxIndex, notes[maxIndex]);
    return { min: minIndex, max: maxIndex };
  }


  function updateLabels() {
    const noteOrderForRange = ["E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3", "E3", "D3", "C3", "B2", "A2", "G2", "F2", "E2"];

    // 最小値ラベルを更新する
    minValueLabel.textContent = noteOrderForRange[noteOrderForRange.length - 1 - minValueSldr.value];

    // 最大値ラベルを更新する
    maxValueLabel.textContent = noteOrderForRange[noteOrderForRange.length - 1 - maxValueSldr.value];
  }

  function getSharpFlatOption() {
    const radioButtons = document.getElementsByName('choice');
    let selectedValue;

    for (const radioButton of radioButtons) {
      if (radioButton.checked) {
        selectedValue = radioButton.value;
        console.log(`選択された値は ${selectedValue} です。`);
        return selectedValue;
        break;
      }
    }
  }


  const synth = new Tone.Synth({
    oscillator: {
      type: "triangle"
    },
    envelope: {
      attack: 0.0001,
      decay: 0.5,
      sustain: 0.5,
      release: 0.1
    }
  }).toDestination();

  let loop = null;

  async function startMetronome(tempo = 100) {
    let notesToPlay = [];
    for (const seq of sequence) {
      notesToPlay.push(notes[planeSharpOrFlat][seq]);
    }

    if (octaveUp) notesToPlay = NotesOctaveUp(notesToPlay);

    tempo = Math.max(50, Math.min(300, tempo));
    let noteIndex = 0;

    if (loop) {
      loop.stop();
      loop.dispose();
    }

    console.log("notesToPlay:" + notesToPlay);
    NOTE_OFFSET = NOTE_OFFSET_START
    loop = new Tone.Loop((time) => {
      const noteToPlay = notesToPlay[noteIndex];
      // synth.triggerAttackRelease("C4", "16n", time);
      if (noteToPlay.includes('#')) {
        // x += 10;
        NOTE_OFFSET += 10;
      }
      if (noteToPlay.includes('b')) {
        // x += 10;
        NOTE_OFFSET += 10;
      }

      invertRectColors(NOTE_OFFSET, 20);
      synth.triggerAttackRelease(noteToPlay, "8n", time);
      NOTE_OFFSET += NOTE_WIDTH * 2 + 10;
      noteIndex = (noteIndex + 1) % sequence.length;
      if (noteIndex === 0) NOTE_OFFSET = NOTE_OFFSET_START;
    }, "4n");

    // console.log(tempo);
    Tone.Transport.bpm.value = parseInt(tempoSlider.value);
    loop.start(0);
    Tone.Transport.start();
  }

  function stopMetronome() {
    Tone.Transport.stop();
    if (previousInvertedArea.startX !== null) {
      invertRectColors(0, 0);// 反転の残りを除去
    }
  }

  function startMetronome1(tempo, oscillatorType = "sine") {
    if (tempo < 50 || tempo > 300) {
      console.error("Tempo must be between 50 and 300");
      return;
    }

    if (loop) {
      loop.stop();
      loop.dispose();
    }

    loop = new Tone.Loop((time) => {
      synth.triggerAttackRelease("C5", "16n", time);
    }, "4n");

    Tone.Transport.bpm.value = tempo;
    loop.start(0);
    Tone.Transport.start();
  }


  function invertRectColors(x, width) {
    // if (!canvas || !canvas.getContext) {
    //   console.log("no canvas");
    //   return;
    // }
    console.log(x, width);
    // const ctx = canvas.getContext("2d");
    const canvasHeight = canvas.height;
    const halfWidth = width / 2;
    const startX = x - halfWidth;

    // 前回反転させた範囲の色を元に戻す
    if (
      previousInvertedArea.startX !== null &&
      previousInvertedArea.width !== null
    ) {
      const prevImageData = ctx.getImageData(
        previousInvertedArea.startX,
        0,
        previousInvertedArea.width,
        canvasHeight
      );
      for (let i = 0; i < prevImageData.data.length; i += 4) {
        prevImageData.data[i] = 255 - prevImageData.data[i]; // R
        prevImageData.data[i + 1] = 255 - prevImageData.data[i + 1]; // G
        prevImageData.data[i + 2] = 255 - prevImageData.data[i + 2]; // B
      }
      ctx.putImageData(prevImageData, previousInvertedArea.startX, 0);
    }

    // 新たな範囲の色を反転させる
    if (width !== 0) {
      const newImageData = ctx.getImageData(startX, 0, width, canvasHeight);
      for (let i = 0; i < newImageData.data.length; i += 4) {
        newImageData.data[i] = 255 - newImageData.data[i]; // R
        newImageData.data[i + 1] = 255 - newImageData.data[i + 1]; // G
        newImageData.data[i + 2] = 255 - newImageData.data[i + 2]; // B
      }
      ctx.putImageData(newImageData, startX, 0);

      // 新たな範囲を記録
      previousInvertedArea.startX = startX;
      previousInvertedArea.width = width;
    } else {
      // widthが0の場合、前回反転させた範囲の記録をリセット
      previousInvertedArea.startX = null;
      previousInvertedArea.width = null;
    }
  }

  function NotesOctaveUp(arr, offset = 1) {
    return arr.map(str => {
      return str.replace(/(\d+)/g, (match, num) => {
        return parseInt(num) + offset;
      });
    });
  }


  const tempoSlider = document.getElementById('range-slider');
  const tempoValue = document.getElementById('slider-value');

  tempoValue.innerText = tempoSlider.value;

  tempoSlider.addEventListener('input', function () {
    tempoValue.innerText = tempoSlider.value;
    Tone.Transport.bpm.value = parseInt(tempoSlider.value);

  });

}
