<script lang="ts">
  import { onDestroy } from "svelte";
  import { Base64 } from 'js-base64';

  export let base64Audio: string;
  let audioElement: HTMLAudioElement;
  let audioUrl: string | null = null;

  function createWavHeader(pcmData: Uint8Array, numChannels = 1, sampleRate = 24000, bitsPerSample = 16) {
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    // "RIFF" chunk descriptor
    view.setUint8(0, 0x52); // 'R'
    view.setUint8(1, 0x49); // 'I'
    view.setUint8(2, 0x46); // 'F'
    view.setUint8(3, 0x46); // 'F'
    view.setUint32(4, 36 + pcmData.length, true); // Size of entire file - 8
    view.setUint8(8, 0x57); // 'W'
    view.setUint8(9, 0x41); // 'A'
    view.setUint8(10, 0x56); // 'V'
    view.setUint8(11, 0x45); // 'E'

    // "fmt " sub-chunk
    view.setUint8(12, 0x66); // 'f'
    view.setUint8(13, 0x6D); // 'm'
    view.setUint8(14, 0x74); // 't'
    view.setUint8(15, 0x20); // ' '
    view.setUint32(16, 16, true); // Length of format data
    view.setUint16(20, 1, true); // Type of format (1 is PCM)
    view.setUint16(22, numChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits per sample

    // "data" sub-chunk
    view.setUint8(36, 0x64); // 'd'
    view.setUint8(37, 0x61); // 'a'
    view.setUint8(38, 0x74); // 't'
    view.setUint8(39, 0x61); // 'a'
    view.setUint32(40, pcmData.length, true); // Size of data section

    return wavHeader;
  }

  $: if (base64Audio) {
    console.log('Received base64Audio data, length:', base64Audio.length);
    // Cleanup previous URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    try {
      // Convert base64 to binary data
      const binaryData = Base64.toUint8Array(base64Audio);
      console.log('Converted to binary data, length:', binaryData.length);

      // Create WAV header
      const wavHeader = createWavHeader(binaryData);
      console.log('Created WAV header');

      // Combine header and PCM data
      const completeWavData = new Uint8Array(wavHeader.byteLength + binaryData.length);
      completeWavData.set(new Uint8Array(wavHeader), 0);
      completeWavData.set(binaryData, wavHeader.byteLength);
      console.log('Combined WAV header and PCM data, total length:', completeWavData.length);

      // Create blob and URL
      const blob = new Blob([completeWavData], { type: 'audio/wav' });
      audioUrl = URL.createObjectURL(blob);
      console.log('Created audio URL:', audioUrl);
    } catch (error) {
      console.error('Error processing audio data:', error);
    }
  }

  $: if (audioUrl && audioElement) {
    console.log('Setting audio source and playing');
    audioElement.src = audioUrl;
    audioElement.play().catch(error => {
      console.error('Audio playback error:', error);
    });
  }

  onDestroy(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  });
</script>

<audio bind:this={audioElement} controls></audio>