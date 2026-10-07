import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

export type MoscowThemeMode = 'light' | 'dark';

export type MoscowThemePalette = {
  mode:MoscowThemeMode;
  background:string;
  surface:string;
  surfaceRaised:string;
  surfaceSoft:string;
  border:string;
  borderStrong:string;
  text:string;
  textMuted:string;
  textSoft:string;
  accent:string;
  accentStrong:string;
  accentText:string;
  positive:string;
  caution:string;
  danger:string;
  shadow:string;
};

const palettes:Record<MoscowThemeMode,MoscowThemePalette>={
  light:{
    mode:'light',
    background:'#f4f1ea',
    surface:'#fffdf8',
    surfaceRaised:'#ffffff',
    surfaceSoft:'#eee9df',
    border:'#ded7ca',
    borderStrong:'#c6bba8',
    text:'#191817',
    textMuted:'#5e625f',
    textSoft:'#7e827f',
    accent:'#8a6a35',
    accentStrong:'#6d5128',
    accentText:'#ffffff',
    positive:'#356b4a',
    caution:'#9b652c',
    danger:'#9b4b46',
    shadow:'#191817'
  },
  dark:{
    mode:'dark',
    background:'#090b0d',
    surface:'#101316',
    surfaceRaised:'#171b1f',
    surfaceSoft:'#20242a',
    border:'#2d3339',
    borderStrong:'#454b53',
    text:'#f5efe4',
    textMuted:'#939aa1',
    textSoft:'#70777e',
    accent:'#d7bb84',
    accentStrong:'#e2c58b',
    accentText:'#17130d',
    positive:'#91af98',
    caution:'#c29b72',
    danger:'#d19a92',
    shadow:'#000000'
  }
};

const THEME_STORAGE_KEY='moscow:v1:theme';

type ThemeContextValue={
  mode:MoscowThemeMode;
  palette:MoscowThemePalette;
  toggleTheme:()=>void;
  setTheme:(mode:MoscowThemeMode)=>void;
};

const ThemeContext=createContext<ThemeContextValue>({
  mode:'dark',
  palette:palettes.dark,
  toggleTheme:()=>undefined,
  setTheme:()=>undefined
});

export function MoscowThemeProvider({children}:{children:React.ReactNode}){
  const system=Appearance.getColorScheme();
  const [mode,setMode]=useState<MoscowThemeMode>(system==='light'?'light':'dark');
  const [hydrated,setHydrated]=useState(false);

  useEffect(()=>{
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(value=>{
        if(value==='light'||value==='dark') setMode(value);
      })
      .catch(()=>undefined)
      .finally(()=>setHydrated(true));
  },[]);

  useEffect(()=>{
    if(!hydrated) return;
    AsyncStorage.setItem(THEME_STORAGE_KEY,mode).catch(()=>undefined);
  },[hydrated,mode]);

  const value=useMemo<ThemeContextValue>(()=>({
    mode,
    palette:palettes[mode],
    toggleTheme:()=>setMode(current=>current==='dark'?'light':'dark'),
    setTheme:setMode
  }),[mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useMoscowTheme(){
  return useContext(ThemeContext);
}

export function getMoscowThemePalette(mode:MoscowThemeMode){
  return palettes[mode];
}
