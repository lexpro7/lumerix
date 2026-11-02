import React from "react";
import {createRoot} from "react-dom/client";
import App from "../../src/App";
import "../../src/styles.css";
createRoot(document.querySelector('#root')!).render(<React.StrictMode><App /></React.StrictMode>);
for(const reference of [false,true])document.querySelector(reference?'#reference-fixture':'#target-fixture')!.addEventListener('click',async()=>{
 const name=reference?'rocket.jpg':'astronaut.png';
 const response=await fetch('/tests/fixtures/'+name);
 const file=new File([await response.blob()],name,{type:reference?'image/jpeg':'image/png'});
 const target=reference?document.querySelector('button[aria-label="Upload reference image"]'):document.querySelector('.studio-viewport');
 if(!target){document.querySelector('#fixture-status')!.textContent='Open Color DNA first';return;}
 const dataTransfer=new DataTransfer();dataTransfer.items.add(file);
 target.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer}));
 document.querySelector('#fixture-status')!.textContent='Dispatched test drop: '+name;
});
