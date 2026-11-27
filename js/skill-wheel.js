function drawSkillWheel(host,wheel,profile,options){
  const svgNS="http://www.w3.org/2000/svg";
  const htmlNS="http://www.w3.org/1999/xhtml";
  function svgElement(tag,attrs){
    const node=document.createElementNS(svgNS,tag);
    for(const [name,value] of Object.entries(attrs))node.setAttribute(name,String(value));
    return node;
  }
  const pointMap=new Map([[skillRoot,{x:0,y:0}],...wheel.nodes.map(node=>[node.id,node])]);
  const extent=Math.max(135,...wheel.rings.map(ring=>ring.radius),...wheel.nodes.map(node=>Math.hypot(node.x,node.y)))+54;
  const span=extent/(options.zoom??1);
  const svg=svgElement("svg",{viewBox:[-span,-span,2*span,2*span].join(" "),class:"wheel-svg",role:"group","aria-label":wheel.name});
  const tooltip=document.createElement("div"),title=document.createElement("strong"),description=document.createElement("div");
  tooltip.id=host.id+"-tooltip";
  tooltip.className="wheel-tooltip";
  tooltip.setAttribute("role","tooltip");
  tooltip.hidden=true;
  tooltip.append(title,description);
  let anchor,touched;
  function hideTooltip(){
    anchor?.removeAttribute("aria-describedby");
    anchor=null;
    tooltip.hidden=true;
  }
  function showTooltip(button,node){
    hideTooltip();
    anchor=button;
    title.textContent=node.name;
    description.textContent=options.description(node);
    description.hidden=!description.textContent;
    tooltip.hidden=false;
    const bounds=host.getBoundingClientRect(),rect=button.getBoundingClientRect();
    const maxX=host.clientWidth-tooltip.offsetWidth-6,maxY=host.clientHeight-tooltip.offsetHeight-6;
    const below=rect.bottom-bounds.top+6;
    const left=rect.left-bounds.left+(rect.width-tooltip.offsetWidth)/2;
    const top=below>maxY?rect.top-bounds.top-tooltip.offsetHeight-6:below;
    tooltip.style.left=Math.max(6,Math.min(left,maxX))+"px";
    tooltip.style.top=Math.max(6,Math.min(top,maxY))+"px";
    button.setAttribute("aria-describedby",tooltip.id);
  }
  for(const ring of wheel.rings){
    svg.append(svgElement("circle",{r:ring.radius,class:"wheel-ring-base"}),svgElement("circle",{r:ring.radius,class:"wheel-ring"}));
  }
  const status=id=>id===skillRoot?"unlocked":pointMap.has(id)?options.nodeState(pointMap.get(id)):"locked";
  for(const {from,to} of wheel.links){
    const a=pointMap.get(from),b=pointMap.get(to);
    if(!a||!b)continue;
    const locked=status(from)!=="unlocked"||status(to)==="locked";
    svg.append(svgElement("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,"data-from":from,"data-to":to,class:"wheel-link"+(locked?"":" lit")}));
  }
  const center=svgElement("foreignObject",{x:-81,y:-81,width:162,height:162});
  const medallion=document.createElementNS(htmlNS,"div");
  medallion.className="wheel-medallion";
  const portrait=profile?.medallion||profile?.image;
  if(portrait){
    const art=document.createElementNS(htmlNS,"img");
    Object.assign(art,{src:options.image(portrait),alt:""});
    medallion.append(art);
  }
  const caption=document.createElementNS(htmlNS,"strong");
  caption.textContent=profile?.name??wheel.name;
  medallion.append(caption);
  center.append(medallion);
  svg.append(center);
  for(const node of wheel.nodes){
    const state=options.nodeState(node);
    const holder=svgElement("foreignObject",{x:node.x-27,y:node.y-27,width:54,height:54});
    const button=document.createElementNS(htmlNS,"button");
    button.type="button";
    button.className="wheel-node "+state+(options.selected===node.id?" selected":"");
    button.dataset.node=node.id;
    button.setAttribute("aria-label",node.name+" · "+({unlocked:"odblokowana",available:"dostępna",locked:"zablokowana"}[state]));
    if(state!=="locked"&&node.image){
      const icon=document.createElementNS(htmlNS,"img");
      Object.assign(icon,{src:options.image(node.image),alt:"",draggable:false});
      button.append(icon);
    }else button.textContent=state==="locked"?"🔒":node.icon||"◆";
    button.onfocus=()=>showTooltip(button,node);
    button.onblur=()=>{if(anchor===button){hideTooltip();touched=null}};
    button.onpointerenter=event=>{if(event.pointerType!=="touch")showTooltip(button,node)};
    button.onpointerleave=()=>{if(anchor===button&&touched!==button)hideTooltip()};
    button.onclick=event=>{
      if(event.pointerType==="touch"&&touched!==button){
        touched=button;
        showTooltip(button,node);
        return;
      }
      options.choose?.(node);
    };
    if(options.drag)button.onpointerdown=event=>options.drag(event,node,svg,holder);
    holder.append(button);
    svg.append(holder);
  }
  host.replaceChildren(svg,tooltip);
}
