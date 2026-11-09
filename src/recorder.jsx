import React, { useEffect, useRef, useState } from 'react';
import { Icon, useMedia, entryIcons } from './ui.jsx';

const timerLabel = (time) => String(Math.floor(time / 60)).padStart(2, '0') + ':' + String(time % 60).padStart(2, '0');

export function Recorder({ onSave, onFile }) {
  const [status, setStatus] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState(null);
  const [error, setError] = useState('');
  const recorder = useRef(null);
  const stream = useRef(null);
  const mounted = useRef(false);
  const audio = useMedia(clip);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  useEffect(() => {
    if (status !== 'recording') return;
    const started = Date.now();
    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - started) / 1000);
      setElapsed(seconds);
      if (seconds >= 300 && recorder.current?.state === 'recording') recorder.current.stop();
    }, 250);
    return () => clearInterval(timer);
  }, [status]);
  async function start() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('이 환경에서는 녹음기를 열 수 없어요. 오디오 파일을 추가해 주세요.');
      return;
    }
    setStatus('request');
    let input;
    try {
      input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { input.getTracks().forEach((track) => track.stop()); return; }
      stream.current = input;
      const device = new MediaRecorder(input);
      const chunks = [];
      recorder.current = device;
      device.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      device.onerror = () => {
        input.getTracks().forEach((track) => track.stop());
        if (mounted.current) { setStatus('idle'); setError('녹음이 중단됐어요. 다시 시도해 주세요.'); }
      };
      device.onstop = () => {
        input.getTracks().forEach((track) => track.stop());
        if (!mounted.current) return;
        const blob = new Blob(chunks, { type: device.mimeType || 'audio/webm' });
        if (!blob.size) { setStatus('idle'); setError('녹음이 너무 짧아요. 다시 시도해 주세요.'); return; }
        setClip({ blob });
        setStatus('ready');
      };
      device.start(250);
      setElapsed(0);
      setStatus('recording');
    } catch {
      input?.getTracks().forEach((track) => track.stop());
      if (mounted.current) { setStatus('idle'); setError('마이크를 열지 못했어요. 권한을 확인하거나 파일을 추가해 주세요.'); }
    }
  }
  return <div className="recorder">
    <div className={'wave ' + (status === 'recording' ? 'live' : '')} aria-hidden="true">
      {Array.from({ length: 31 }, (_, i) => <i key={i} style={{ '--i': i, '--h': (11 + Math.abs(Math.sin(i * 1.9) * Math.sin(i / 9)) * 47) + 'px' }} />)}
    </div>
    <div className="time">{timerLabel(elapsed)}</div>
    {status === 'ready' ? <>
      {audio && <audio controls src={audio} />}
      <button className="primary" onClick={() => onSave(clip.blob)}>트랙에 추가</button>
      <button className="text-button" onClick={start}>다시 녹음</button>
    </> : <>
      <button className={'record-button ' + (status === 'recording' ? 'is-recording' : '')}
        aria-label={status === 'recording' ? '녹음 중지' : '녹음 시작'}
        disabled={status === 'request'}
        onClick={() => status === 'recording' ? recorder.current?.stop() : start()}><span /></button>
      <p className="muted">{status === 'recording' ? '녹음 중 · 최대 5분' : status === 'request' ? '마이크 권한 확인 중' : '버튼을 눌러 소리를 담아보세요'}</p>
      {status === 'idle' && <label className="text-button file-label">오디오 파일 선택<input type="file" accept="audio/*" onChange={onFile} /></label>}
    </>}
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}

export function TrackMedia({ entry, onPlay, autoPlay = false }) {
  const src = useMedia(entry);
  if (!entry) return <div className="media-empty"><Icon name="disc" size={36} /><p>이 날의 트랙이 비어 있어요.</p></div>;
  if (entry.kind === 'memo') return <blockquote className="memo-view">{entry.note}</blockquote>;
  if (!src) return <div className="media-empty"><Icon name={entryIcons[entry.kind]} size={34} /></div>;
  if (entry.kind === 'photo') return <img className="media-photo" src={src} alt={entry.name} />;
  if (entry.kind === 'video') return <video key={src} controls playsInline autoPlay={autoPlay} src={src} onPlay={() => onPlay?.(true)} onPause={() => onPlay?.(false)} onEnded={() => onPlay?.(false)} />;
  return <audio key={src} controls autoPlay={autoPlay} src={src} onPlay={() => onPlay?.(true)} onPause={() => onPlay?.(false)} onEnded={() => onPlay?.(false)} />;
}
