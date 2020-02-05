import Reverb from '@logue/reverb';
import SynthesizerNote from './sound_font_synth_note.js';
import Parser from './sf2.js';
/**
 * Synthesizer Class
 * @private
 */

export class Synthesizer {
  /**
   * @param {Uint8Array} input
   */
  constructor(input) {
    /** @type {number} */
    let i;
    /** @type {number} */

    let il;
    /** @type {Uint8Array} */

    this.input = input;
    /** @type {SoundFont.Parser} */

    this.parser = {};
    /** @type {number} */

    this.bank = 0;
    /** @type {Array.<Array.<Object>>} */

    this.bankSet = {};
    /** @type {number} */

    this.bufferSize = 2048;
    /** @type {AudioContext} */

    this.ctx = this.getAudioContext();
    /** @type {GainNode} */

    this.gainMaster = this.ctx.createGain();
    /** @type {AudioBufferSourceNode} */

    this.bufSrc = this.ctx.createBufferSource();
    /** @type {Array.<number>} */

    this.channelInstrument = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /** @type {Array.<number>} */

    this.channelBank = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 127, 0, 0, 0, 0];
    /** @type {Array.<number>} */

    this.channelVolume = [127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127];
    /** @type {Array.<number>} */

    this.channelPanpot = [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64];
    /** @type {Array.<number>} */

    this.channelPitchBend = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /** @type {Array.<number>} */

    this.channelPitchBendSensitivity = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    /** @type {Array.<number>} */

    this.channelExpression = [127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127];
    /** @type {Array.<number>} */

    this.channelAttack = [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64];
    /** @type {Array.<number>} */

    this.channelDecay = [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64];
    /** @type {Array.<number>} */

    this.channelSustin = [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64];
    /** @type {Array.<number>} */

    this.channelRelease = [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64];
    /** @type {Array.<boolean>} */

    this.channelHold = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    /** @type {Array.<number>} */

    this.channelHarmonicContent = [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64];
    /** @type {Array.<number>} */

    this.channelCutOffFrequency = [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64];
    /** @type {boolean} */

    this.isGS = false;
    /** @type {boolean} */

    this.isXG = false;
    /** @type {Array.<Array.<string>>} */

    this.programSet = [];
    /** @type {Array.<boolean>} */

    this.channelMute = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    /** @type {Array.<Array.<SoundFont.SynthesizerNote>>} */

    this.currentNoteOn = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
    /** @type {number} @const */

    this.baseVolume = 1 / 0xffff;
    /** @type {number} */

    this.masterVolume = 16384;
    /** @type {Array.<boolean>} */

    this.percussionPart = [false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false];
    /** @type {Array.<number>} */

    this.percussionVolume = new Array(128);

    for (i = 0, il = this.percussionVolume.length; i < il; ++i) {
      this.percussionVolume[i] = 127;
    }

    this.programSet = {};
    /** @type {Array.<Reverb>}リバーブエフェクト（チャンネル毎に用意する） */

    this.reverb = [];
    /** @type {Array.<BiquadFilterNode>} フィルタ（ビブラートなど） */

    this.filter = [];

    for (i = 0; i < 16; ++i) {
      this.reverb[i] = new Reverb(this.ctx, {
        mix: 0.315
      }); // リバーブエフェクトのデフォルト値は40なので40/127の値をドライ／ウェット値となる
      // フィルタを定義

      this.filter[i] = this.ctx.createBiquadFilter();
    }
  }
  /**
   * @return {AudioContext}
   */


  getAudioContext() {
    /** @type {AudioContext} */
    const ctx = new (window.AudioContext || window.webkitAudioContext)(); // for legacy browsers

    ctx.createGain = ctx.createGain || ctx.createGainNode; // Defreeze AudioContext for iOS.

    const initAudioContext = () => {
      document.removeEventListener('touchstart', initAudioContext); // wake up AudioContext

      const emptySource = ctx.createBufferSource();
      emptySource.start();
      emptySource.stop();
    };

    document.addEventListener('touchstart', initAudioContext);
    return ctx;
  }
  /**
   * System Reset
   * @param {string} mode
   */


  init(mode = 'GM') {
    this.gainMaster.disconnect();
    /** @type {number} */

    let i;
    this.parser = new Parser(this.input, {
      sampleRate: this.ctx.sampleRate
    });
    this.bankSet = this.createAllInstruments();
    this.isXG = false;
    this.isGS = false;

    if (mode == 'XG') {
      this.isXG = true;
    } else if (mode == 'GS') {
      this.isGS = true;
    }

    for (i = 0; i < 16; ++i) {
      this.programChange(i, 0x00);
      this.volumeChange(i, 0x64);
      this.panpotChange(i, 0x40);
      this.pitchBend(i, 0x00, 0x40); // 8192

      this.pitchBendSensitivity(i, 2);
      this.channelHold[i] = false;
      this.channelExpression[i] = 127;
      this.channelBank[i] = i === 9 ? 127 : 0;
      this.attackTime(i, 64);
      this.decayTime(i, 64);
      this.sustinTime(i, 64);
      this.releaseTime(i, 64);
      this.harmonicContent(i, 64);
      this.cutOffFrequency(i, 64);
      this.reverbDepth(i, 40);
      this.updateBankSelect(i);
      this.updateProgramSelect(i);
    }

    this.setPercussionPart(9, true);

    for (i = 0; i < 128; ++i) {
      this.percussionVolume[i] = 127;
    }

    this.gainMaster.connect(this.ctx.destination);
    /*
    if (this.element) {
      this.element.querySelector('.header div:before').innerText = mode + ' Mode';
      this.element.dataset.mode = mode;
    }
    */
  }
  /**
   */


  close() {
    this.ctx.close();
  }
  /**
   * @param {Uint8Array} input
   */


  refreshInstruments(input) {
    this.input = input;
    this.parser = new Parser(input);
    this.bankSet = this.createAllInstruments();
  }
  /** @return {Array.<Array.<Object>>} */


  createAllInstruments() {
    /** @type {SoundFont.Parser} */
    const parser = this.parser;
    parser.parse();
    /** @type {Array} TODO */

    const presets = parser.createPreset();
    /** @type {Array} TODO */

    const instruments = parser.createInstrument();
    /** @type {Array} */

    const banks = [];
    /** @type {Array.<Array.<Object>>} */

    let bank;
    /** @type {number} */

    let bankNumber;
    /** @type {Object} TODO */

    let preset;
    /** @type {Object} */

    let instrument;
    /** @type {number} */

    let presetNumber;
    /** @type {number} */

    let i;
    /** @type {number} */

    let il;
    /** @type {number} */

    let j;
    /** @type {number} */

    let jl;
    /** @type {string} */

    let presetName;
    const programSet = [];

    for (i = 0, il = presets.length; i < il; ++i) {
      preset = presets[i];
      presetNumber = preset.header.preset;
      bankNumber = preset.header.bank;
      presetName = preset.name.replace(/\0*$/, '');

      if (typeof preset.instrument !== 'number') {
        continue;
      }

      instrument = instruments[preset.instrument];

      if (instrument.name.replace(/\0*$/, '') === 'EOI') {
        continue;
      } // select bank


      if (banks[bankNumber] === void 0) {
        banks[bankNumber] = [];
      }

      bank = banks[bankNumber];
      bank[presetNumber] = {};
      bank[presetNumber].name = presetName;

      for (j = 0, jl = instrument.info.length; j < jl; ++j) {
        this.createNoteInfo(parser, instrument.info[j], bank[presetNumber]);
      }

      if (!programSet[bankNumber]) {
        programSet[bankNumber] = {};
      }

      programSet[bankNumber][presetNumber] = presetName;
    }

    this.programSet = programSet;
    return banks;
  }
  /**
   * @param {Parser} parser
   * @param {*} info
   * @param {*} preset
   */


  createNoteInfo(parser, info, preset) {
    /** @type {Generator} */
    const generator = info.generator;

    if (generator.keyRange === void 0 || generator.sampleID === void 0) {
      return;
    } // console.log(generator);

    /** @type {number} */


    const volDelay = this.getModGenAmount(generator, 'delayVolEnv', -12000);
    /** @type {number} */

    const volAttack = this.getModGenAmount(generator, 'attackVolEnv', -12000);
    /** @type {number} */

    const volHold = this.getModGenAmount(generator, 'holdVolEnv', -12000);
    /** @type {number} */

    const volDecay = this.getModGenAmount(generator, 'decayVolEnv', -12000);
    /** @type {number} */

    const volSustain = this.getModGenAmount(generator, 'sustainVolEnv');
    /** @type {number} */

    const volRelease = this.getModGenAmount(generator, 'releaseVolEnv', -12000);
    /** @type {number} */

    const modDelay = this.getModGenAmount(generator, 'delayModEnv', -12000);
    /** @type {number} */

    const modAttack = this.getModGenAmount(generator, 'attackModEnv', -12000);
    /** @type {number} */

    const modHold = this.getModGenAmount(generator, 'holdModEnv', -12000);
    /** @type {number} */

    const modDecay = this.getModGenAmount(generator, 'decayModEnv', -12000);
    /** @type {number} */

    const modSustain = this.getModGenAmount(generator, 'sustainModEnv');
    /** @type {number} */

    const modRelease = this.getModGenAmount(generator, 'releaseModEnv', -12000);
    /** @type {number} */

    const scale = this.getModGenAmount(generator, 'scaleTuning', 100) / 100;
    /** @type {number} */

    const freqVibLFO = this.getModGenAmount(generator, 'freqVibLFO');
    /** @type {number} */

    const pan = this.getModGenAmount(generator, 'pan');
    /** @type {number} */

    const tune = this.getModGenAmount(generator, 'coarseTune') + this.getModGenAmount(generator, 'fineTune') / 100;

    for (let i = generator.keyRange.lo, il = generator.keyRange.hi; i <= il; ++i) {
      if (preset[i]) {
        continue;
      }
      /** @type {number} */


      const sampleId = this.getModGenAmount(generator, 'sampleID');
      /** @type {object} */

      const sampleHeader = parser.sampleHeader[sampleId];
      preset[i] = {
        'sample': parser.sample[sampleId],
        'sampleRate': sampleHeader.sampleRate,
        'sampleModes': this.getModGenAmount(generator, 'sampleModes'),
        'basePlaybackRate': 1.0594630943592953 // Math.pow(2, 1 / 12)
        ** ((i - this.getModGenAmount(generator, 'overridingRootKey', sampleHeader.originalPitch) + tune + sampleHeader.pitchCorrection / 100) * scale),
        'modEnvToPitch': this.getModGenAmount(generator, 'modEnvToPitch') / 100,
        'scaleTuning': scale,
        'start': this.getModGenAmount(generator, 'startAddrsCoarseOffset') * 32768 + this.getModGenAmount(generator, 'startAddrsOffset'),
        'end': this.getModGenAmount(generator, 'endAddrsCoarseOffset') * 32768 + this.getModGenAmount(generator, 'endAddrsOffset'),
        'loopStart': // (sampleHeader.startLoop - sampleHeader.start) +
        sampleHeader.startLoop + this.getModGenAmount(generator, 'startloopAddrsCoarseOffset') * 32768 + this.getModGenAmount(generator, 'startloopAddrsOffset'),
        'loopEnd': // (sampleHeader.endLoop - sampleHeader.start) +
        sampleHeader.endLoop + this.getModGenAmount(generator, 'endloopAddrsCoarseOffset') * 32768 + this.getModGenAmount(generator, 'endloopAddrsOffset'),
        'volDelay': 2 ** (volDelay / 1200),
        'volAttack': 2 ** (volAttack / 1200),
        'volHold': 2 ** (volHold / 1200) * 2 ** ((60 - i) * this.getModGenAmount(generator, 'keynumToVolEnvHold') / 1200),
        'volDecay': 2 ** (volDecay / 1200) * 2 ** ((60 - i) * this.getModGenAmount(generator, 'keynumToVolEnvDecay') / 1200),
        'volSustain': volSustain / 1000,
        'volRelease': 2 ** (volRelease / 1200),
        'modDelay': 2 ** (modDelay / 1200),
        'modAttack': 2 ** (modAttack / 1200),
        'modHold': 2 ** (modHold / 1200) * 2 ** ((60 - i) * this.getModGenAmount(generator, 'keynumToModEnvHold') / 1200),
        'modDecay': 2 ** (modDecay / 1200) * 2 ** ((60 - i) * this.getModGenAmount(generator, 'keynumToModEnvDecay') / 1200),
        'modSustain': modSustain / 1000,
        'modRelease': 2 ** (modRelease / 1200),
        'initialFilterFc': this.getModGenAmount(generator, 'initialFilterFc', 13500),
        'modEnvToFilterFc': this.getModGenAmount(generator, 'modEnvToFilterFc'),
        'initialFilterQ': this.getModGenAmount(generator, 'initialFilterQ'),
        'reverbEffectSend': this.getModGenAmount(generator, 'reverbEffectSend'),
        'initialAttenuation': this.getModGenAmount(generator, 'initialAttenuation'),
        'freqVibLFO': freqVibLFO ? 2 ** (freqVibLFO / 1200) * 8.176 : void 0,
        'pan': pan ? pan / 1200 : void 0
      };
    }
  }

  /**
   * @param {Object} generator
   * @param {string} enumeratorType
   * @param {number=} optDefault
   * @return {number}
   */
  getModGenAmount(generator, enumeratorType, optDefault = null) {
    return generator[enumeratorType] ? generator[enumeratorType].amount : optDefault;
  }
  /**
   */


  start() {
    this.connect();
    this.bufSrc.start(0);
    this.setMasterVolume(16383);
  }
  /**
   * @param {number} volume
   */


  setMasterVolume(volume) {
    this.masterVolume = volume;
    this.gainMaster.gain.value = this.baseVolume * (volume / 16384);
  }
  /**
   */


  connect() {
    this.bufSrc.connect(this.gainMaster);
  }
  /**
   */


  disconnect() {
    this.bufSrc.disconnect(this.gainMaster);
    this.bufSrc.buffer = null;
  }
  /**
   * @param {number} channel NoteOn するチャンネル.
   * @param {number} key NoteOn するキー.
   * @param {number} velocity 強さ.
   */


  noteOn(channel, key, velocity) {
    /** @type {number} */
    const bankIndex = this.channelBank[channel];
    /** @type {Object} */

    const bank = typeof this.bankSet[bankIndex] === 'object' ? this.bankSet[bankIndex] : this.bankSet[0];
    /** @type {Object} */

    let instrument;

    if (typeof bank[this.channelInstrument[channel]] === 'object') {
      // 音色が存在する場合
      instrument = bank[this.channelInstrument[channel]];
    } else if (this.percussionPart[channel] == true) {
      // パーカッションバンクが選択されている場合で音色が存在しない場合Standard Kitを選択
      instrument = this.bankSet[this.isXG ? 127 : 128][0];
    } else {
      // 通常バンクが選択されている状態で音色が存在しない場合バンク0を選択
      instrument = this.bankSet[0][this.channelInstrument[channel]];
    }

    if (instrument[key] === void 0) {
      // TODO
      console.warn('instrument not found: bank=%s instrument=%s channel=%s key=%s', bankIndex, this.channelInstrument[channel], channel, key);
      return;
    }
    /** @type {Object} */


    const instrumentKey = instrument[key];
    /** @type {number} */

    let panpot = this.channelPanpot[channel] === 0 ? Math.random() * 127 | 0 : this.channelPanpot[channel] - 64;
    panpot /= panpot < 0 ? 64 : 63; // create note information

    instrumentKey['channel'] = channel;
    instrumentKey['key'] = key;
    instrumentKey['velocity'] = velocity;
    instrumentKey['panpot'] = panpot;
    instrumentKey['volume'] = this.channelVolume[channel] / 127;
    instrumentKey['pitchBend'] = this.channelPitchBend[channel] - 8192;
    instrumentKey['expression'] = this.channelExpression[channel];
    instrumentKey['pitchBendSensitivity'] = Math.round(this.channelPitchBendSensitivity[channel]);
    instrumentKey['mute'] = this.channelMute[channel];
    instrumentKey['releaseTime'] = this.channelRelease[channel];
    instrumentKey['cutOffFrequency'] = this.cutOffFrequency[channel];
    instrumentKey['harmonicContent'] = this.harmonicContent[channel];
    instrumentKey['reverb'] = this.reverb[channel]; // percussion

    if (bankIndex > 125) {
      if (key === 42 || key === 44) {
        // 42: Closed Hi-Hat
        // 44: Pedal Hi-Hat
        // 46: Open Hi-Hat
        this.noteOff(channel, 46, 0);
      }

      if (key === 80) {
        // 80: Mute Triangle
        // 81: Open Triangle
        this.noteOff(channel, 81, 0);
      }

      instrument['volume'] *= this.percussionVolume[key] / 127;
    } // note on

    /** @type {SynthesizerNote} */


    const note = new SynthesizerNote(this.ctx, this.gainMaster, instrumentKey);
    note.noteOn();
    this.currentNoteOn[channel].push(note);
    this.updateSynthElement(channel, key, velocity);
  }
  /**
   * @param {number} channel NoteOff するチャンネル.
   * @param {number} key NoteOff するキー.
   * @param {number} velocity 強さ.
   */


  noteOff(channel, key, velocity) {
    /** @type {number} */
    let i;
    /** @type {number} */

    let il;
    /** @type {Array.<SynthesizerNote>} */

    const currentNoteOn = this.currentNoteOn[channel];
    /** @type {SynthesizerNote} */

    let note;
    /** @type {boolean} */

    const hold = this.channelHold[channel];

    for (i = 0, il = currentNoteOn.length; i < il; ++i) {
      note = currentNoteOn[i];

      if (note.key === key) {
        note.noteOff(); // hold している時は NoteOff にはするがリリースはしない

        if (!hold) {
          note.release();
          currentNoteOn.splice(i, 1);
          --i;
          --il;
        }
      }
    }

    this.updateSynthElement(channel, key, 0);
  }
  /**
   * @param {number} channel ホールドするチャンネル
   * @param {number} value 値
   */


  hold(channel, value) {
    /** @type {Array.<SynthesizerNote>} */
    const currentNoteOn = this.currentNoteOn[channel];
    /** @type {boolean} */

    const hold = this.channelHold[channel] = !(value < 64);
    /** @type {SynthesizerNote} */

    let note;
    /** @type {number} */

    let i;
    /** @type {number} */

    let il;

    if (!hold) {
      for (i = 0, il = currentNoteOn.length; i < il; ++i) {
        note = currentNoteOn[i];

        if (note.isNoteOff()) {
          note.release();
          currentNoteOn.splice(i, 1);
          --i;
          --il;
        }
      }
    }

    if (this.element) {
      /** @type {HTMLDivElement} */
      const channelElement = this.element.querySelector('.instrument > .channel:nth-child(' + (channel + 1) + ')');

      if (this.channelHold[channel]) {
        channelElement.classList.add('hold');
      } else {
        channelElement.classList.remove('hold');
      }
    }
  }
  /**
   * @param {number} channel チャンネルのバンクセレクトMSB
   * @param {number} value 値
   */


  bankSelectMsb(channel, value) {
    if (this.isXG) {
      // 念の為バンクを0にリセット
      this.channelBank[channel] = 0; // XG音源は、MSB→LSBの優先順でバンクセレクトをする。

      if (value === 64) {
        // Bank Select MSB #64 (Voice Type: SFX)
        this.channelBank[channel] = 125;
        this.percussionPart[channel] = true;
      } else if (value === 126 || value === 127) {
        // Bank Select MSB #126 (Voice Type: Drum)
        // Bank Select MSB #127 (Voice Type: Drum)
        this.channelBank[channel] = value;
        this.percussionPart[channel] = true;
      }
    } else if (this.isGS) {
      // GS音源
      // ※チャンネル10のバンク・セレクト命令は無視する。
      this.channelBank[channel] = channel === 9 ? 128 : value;
      this.percussionPart[channel] = value === 128;
    } else {
      // GM音源モードのときはバンク・セレクトを無視
      return;
    }

    this.updateBankSelect(channel);
  }
  /**
   * @param {number} channel チャンネルのバンクセレクトLSB
   * @param {number} value 値
   */


  bankSelectLsb(channel, value) {
    // XG音源以外は処理しない
    if (!this.isXG || this.percussionPart[channel] === true) {
      return;
    } // 125より値が大きい場合、パーカッションとして処理


    this.percussionPart[channel] = value >= 125;
    this.channelBank[channel] = value;
    this.updateBankSelect(channel);
  }
  /**
   * @param {number} channel 音色を変更するチャンネル.
   * @param {number} instrument 音色番号.
   */


  programChange(channel, instrument) {
    this.channelInstrument[channel] = instrument;
    this.bankChange(channel, this.channelBank[channel]);

    if (this.element) {
      this.element.querySelector('.instrument > .channel:nth-child(' + (channel + 1) + ') .program > select').value = instrument;
    }
  }
  /**
   * @param {number} channel 音色を変更するチャンネル.
   * @param {number} bank バンク・セレクト.
   */


  bankChange(channel, bank) {
    if (typeof this.bankSet[bank] === 'object') {
      // バンクが存在するとき
      this.channelBank[channel] = bank;
    } else {
      // バンクが存在しないとき
      if (this.percussionPart[channel]) {
        // パーカッション
        this.channelBank[channel] = !this.isXG ? 128 : 127;
      } else {
        // 存在しない場合0を選択
        this.channelBank[channel] = 0;
      }
    } // TODO: 厳密にはMIDI音源はプログラムチェンジがあったときにバンク・セレクトが反映される。


    this.updateProgramSelect(channel);

    if (this.element) {
      this.element.querySelector('.instrument > .channel:nth-child(' + (channel + 1) + ') > .bank > select').value = bank;
    }
  }
  /**
   * @param {number} channel 音量を変更するチャンネル.
   * @param {number} volume 音量(0-127).
   */


  volumeChange(channel, volume) {
    if (this.element) {
      this.element.querySelector('.instrument > .channel:nth-child(' + (channel + 1) + ') > .volume var').innerText = volume;
    }

    this.channelVolume[channel] = volume;
  }
  /**
   * @param {number} channel 音量を変更するチャンネル.
   * @param {number} expression 音量(0-127).
   */


  expression(channel, expression) {
    /** @type {number} */
    let i;
    /** @type {number} */

    let il;
    /** @type {Array.<SynthesizerNote>} */

    const currentNoteOn = this.currentNoteOn[channel];

    for (i = 0, il = currentNoteOn.length; i < il; ++i) {
      currentNoteOn[i].updateExpression(expression);
    }

    this.channelExpression[channel] = expression;
  }
  /**
   * @param {number} channel panpot を変更するチャンネル.
   * @param {number} panpot panpot(0-127).
   */


  panpotChange(channel, panpot) {
    if (this.element) {
      this.element.querySelector('.instrument > .channel:nth-child(' + (channel + 1) + ') > .panpot > meter').value = panpot;
    }

    this.channelPanpot[channel] = panpot;
  }
  /**
   * @param {number} channel panpot を変更するチャンネル.
   * @param {number} lowerByte
   * @param {number} higherByte
   */


  pitchBend(channel, lowerByte, higherByte) {
    /** @type {number} */
    const bend = lowerByte & 0x7f | (higherByte & 0x7f) << 7;
    /** @type {number} */

    let i;
    /** @type {number} */

    let il;
    /** @type {Array.<SoundFont.SynthesizerNote>} */

    const currentNoteOn = this.currentNoteOn[channel];
    /** @type {number} */

    const calculated = bend - 8192;

    if (this.element) {
      this.element.querySelector('.instrument > .channel:nth-child(' + (channel + 1) + ') > .pitchBend > meter').value = calculated;
    }

    for (i = 0, il = currentNoteOn.length; i < il; ++i) {
      currentNoteOn[i].updatePitchBend(calculated);
    }

    this.channelPitchBend[channel] = bend;
  }
  /**
   * @param {number} channel pitch bend sensitivity を変更するチャンネル.
   * @param {number} sensitivity
   */


  pitchBendSensitivity(channel, sensitivity) {
    if (this.element) {
      document.querySelector('.instrument > .channel:nth-child(' + (channel + 1) + ') > .pitchBendSensitivity > var').innerText = sensitivity;
    }

    this.channelPitchBendSensitivity[channel] = sensitivity;
  }
  /**
   * @param {number} channel
   * @param {number} attackTime
   */


  attackTime(channel, attackTime) {
    this.channelAttack[channel] = attackTime;
  }
  /**
   * @param {number} channel
   * @param {number} decayTime
   */


  decayTime(channel, decayTime) {
    this.channelDecay[channel] = decayTime;
  }
  /**
   * @param {number} channel
   * @param {number} sustinTime
   */


  sustinTime(channel, sustinTime) {
    this.channelSustin[channel] = sustinTime;
  }
  /**
   * @param {number} channel
   * @param {number} releaseTime
   */


  releaseTime(channel, releaseTime) {
    this.channelRelease[channel] = releaseTime;
  }
  /**
   * @param {number} channel
   * @param {number} value
   */


  harmonicContent(channel, value) {
    this.channelHarmonicContent[channel] = value;
  }
  /**
   * @param {number} channel
   * @param {number} value
   */


  cutOffFrequency(channel, value) {
    this.channelCutOffFrequency[channel] = value;
  }
  /**
   * リバーブエフェクト
   * @param {number} channel
   * @param {number} depth
   */


  reverbDepth(channel, depth) {
    // リバーブ深度は、ドライ／ウェット比とする。
    this.reverb[channel].mix(depth / 127);
  }
  /**
   * モデュレーター
   * @param {number} channel
   * @param {number} depth
   */


  modulationDepth(channel, depth) {} // TODO: LFOの反映量
  // this.filter[channel].mix(depth / 127);

  /**
   * @param {number} channel pitch bend sensitivity を取得するチャンネル.
   * @return {number}
   */


  getPitchBendSensitivity(channel) {
    return this.channelPitchBendSensitivity[channel];
  }
  /**
   * @param {number} key
   * @param {number} volume
   */


  drumInstrumentLevel(key, volume) {
    this.percussionVolume[key] = volume;
  }
  /**
   * @param {number} channel NoteOff するチャンネル.
   */


  allNoteOff(channel) {
    /** @type {Array.<SynthesizerNote>} */
    const currentNoteOn = this.currentNoteOn[channel]; // ホールドを解除

    this.hold(channel, 0); // 再生中の音をすべて止める

    while (currentNoteOn.length > 0) {
      this.noteOff(channel, currentNoteOn[0].key, 0);
    }
  }
  /**
   * @param {number} channel 音を消すチャンネル.
   */


  allSoundOff(channel) {
    /** @type {Array.<SynthesizerNote>} */
    const currentNoteOn = this.currentNoteOn[channel];
    /** @type {SynthesizerNote} */

    let note;

    while (currentNoteOn.length > 0) {
      note = currentNoteOn.shift();
      this.noteOff(channel, note.key, 0);
      note.release();
      note.disconnect();
    } // ホールドを解除


    this.hold(channel, 0);
  }
  /**
   * @param {number} channel リセットするチャンネル
   */


  resetAllControl(channel) {
    this.allNoteOff(channel);
    this.expression(channel, 127);
    this.pitchBend(channel, 0x00, 0x40);
  }
  /**
   * @param {number} channel ミュートの設定を変更するチャンネル.
   * @param {boolean} mute ミュートにするなら true.
   */


  mute(channel, mute) {
    /** @type {Array.<SynthesizerNote>} */
    const currentNoteOn = this.currentNoteOn[channel];
    /** @type {number} */

    let i;
    /** @type {number} */

    let il;
    this.channelMute[channel] = mute;

    if (mute) {
      for (i = 0, il = currentNoteOn.length; i < il; ++i) {
        currentNoteOn[i].disconnect();
      }
    } else {
      for (i = 0, il = currentNoteOn.length; i < il; ++i) {
        currentNoteOn[i].connect();
      }
    }
  }
  /**
   * @param {number} channel TODO:ドラムパートとしてセットするチャンネル
   * @param {boolean} sw ドラムか通常かのスイッチ
   */


  setPercussionPart(channel, sw) {
    if (!this.isXG) {
      this.channelBank[channel] = 128;
    } else {
      this.channelBank[channel] = 127;
    }

    this.percussionPart[channel] = sw;
  }

}
export default Synthesizer;