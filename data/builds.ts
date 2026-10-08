export type Build = {id:string;title:string;description:string;category:string;tags:string[];href:string;};
// Add an entry only when the corresponding experiment is working.
export const builds:Build[]=[{id:'000',title:'A home for what comes next.',description:'The starting point: a shared interface, an experiment index, and a place to build in public.',category:'Interfaces',tags:['Next.js','React','Interfaces'],href:'/'}];
