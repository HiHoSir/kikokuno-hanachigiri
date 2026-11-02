// Loading duration and opaque third-party errors are not proof of startup failure.
(function(){
 const panel=document.querySelector('#error'),loading=document.querySelector('#loading');
 let ready=false;
 function show(message){panel.style.display='block';panel.textContent=(ready?'実行エラー: ':'起動エラー: ')+message;}
 window.addEventListener('error',event=>{
  const message=event.message||'';
  if(message==='Script error.'||message==='Script error')return;
  show(message||'リソースの読み込みに失敗しました');
 });
 window.addEventListener('unhandledrejection',event=>show(String(event.reason?.message||event.reason||'モジュールの読み込みに失敗しました')));
 const slow=setTimeout(()=>{if(!ready)loading.textContent='読み込みに時間がかかっています。通信状態をご確認ください。';},30000);
 window.addEventListener('kikoku:first-frame',()=>{ready=true;clearTimeout(slow);loading.style.display='none';},{once:true});
})();
