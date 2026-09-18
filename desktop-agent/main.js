
const { app, BrowserWindow, Tray, Menu, powerMonitor } = require('electron');
const path = require('path');
const agent = require('./agent-core');

let tray, win;

function createTray() {
  tray = new Tray(path.join(__dirname,'iconTemplate.png'));
  const menu = Menu.buildFromTemplate([
    {label:'HRMS Live Attendance',enabled:false},
    {type:'separator'},
    {label:'Show Status',click:()=>{ if(win) win.show(); }},
    {label:'Quit Agent',click:()=>{agent.stop();app.quit();}}
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip('HRMS Live Attendance Agent');
}

app.whenReady().then(async()=>{
  createTray();
  await agent.start(powerMonitor);

  powerMonitor.on('lock-screen',()=>agent.setState('LOCKED').catch(console.error));
  powerMonitor.on('unlock-screen',()=>agent.setState('ACTIVE').catch(console.error));
  powerMonitor.on('suspend',()=>agent.setState('SLEEPING').catch(console.error));
  powerMonitor.on('resume',()=>agent.setState('ACTIVE').catch(console.error));
  powerMonitor.on('user-did-become-active',()=>agent.setState('ACTIVE').catch(console.error));
});
app.on('window-all-closed',e=>e.preventDefault());
app.on('before-quit',()=>agent.stop());
