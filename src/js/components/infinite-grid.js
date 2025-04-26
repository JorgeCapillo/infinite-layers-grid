export default class InfiniteGrid {
  constructor({ el, sources, data, originalSize }) {
    this.$container   = el;
    this.sources      = sources;
    this.data         = data;
    this.originalSize = originalSize;

    this.scroll = {
      ease:   0.06,
      current:{ x: 0, y: 0 },
      target: { x: 0, y: 0 },
      last:   { x: 0, y: 0 },
      delta: { x: { c: 0, t: 0 }, y: { c: 0, t: 0 } }
    };
    this.mouse = {
      x: { t: 0.5, c: 0.5 },
      y: { t: 0.5, c: 0.5 }
    };

    this.items = [];

    this.onResize = this.onResize.bind(this);
    this.onWheel  = this.onWheel.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.render   = this.render.bind(this);

    window.addEventListener('resize', this.onResize);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('mousemove', this.onMouseMove);
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('visible', entry.isIntersecting);
      });
    });
    this.onResize();
    this.render();
  }

  onResize() {
    this.winW = window.innerWidth;
    this.winH = window.innerHeight;

    // tileSize como viewport + margen porcentual
    this.tileSize = {
      w: this.winW,
      h: (this.winW) * (this.originalSize.h / this.originalSize.w),
    };

    // reset scroll
    this.scroll.current = { x: 0, y: 0 };
    this.scroll.target  = { x: 0, y: 0 };
    this.scroll.last    = { x: 0, y: 0 };

    // limpiamos DOM
    this.$container.innerHTML = '';

    // 1) creamos un array de “baseItems” con su src y dimensiones escaladas
    const baseItems = this.data.map((d, i) => {
      const scaleX = this.tileSize.w / this.originalSize.w;
      const scaleY = this.tileSize.h / this.originalSize.h;
      const source = this.sources[i % this.sources.length];
      return {
        src: source.src,
        caption: source.caption,
        x:   d.x * scaleX,
        y:   d.y * scaleY,
        w:   d.w * scaleX,
        h:   d.h * scaleY
      };
    });

    // 2) duplicamos cada baseItem en un grid 2×2 (puedes hacer 3×3 si quieres scroll en todas direcciones)
    this.items = [];
    const repsX = [0, this.tileSize.w];
    const repsY = [0, this.tileSize.h];

    baseItems.forEach(base => {
      repsX.forEach(offsetX => {
        repsY.forEach(offsetY => {
          const el = document.createElement('div');
          el.classList.add('item');
          el.style.width    = `${base.w}px`;
          const imageContainer = document.createElement('div');
          imageContainer.classList.add('item-image');
          imageContainer.style.width  = `${base.w}px`;
          imageContainer.style.height = `${base.h}px`;
          el.appendChild(imageContainer);
          const img = new Image();
          img.src = `./img/${base.src}`;
          imageContainer.appendChild(img);

          const caption = document.createElement('small');
          caption.innerHTML = base.caption;
          el.appendChild(caption);
          this.$container.appendChild(el);
          this.observer.observe(el);

          this.items.push({
            el:     el,
            imageContainer: imageContainer,
            img:    img,
            x:      base.x + offsetX,
            y:      base.y + offsetY,
            w:      base.w,
            h:      base.h,
            extraX: 0,
            extraY: 0,
            rect:  el.getBoundingClientRect(),
            ease:   Math.random() * 0.5 + 0.5,
          });
        });
      });
    });
    this.tileSize.w *= 2;
    this.tileSize.h *= 2;

    this.scroll.current.x = this.scroll.target.x = this.scroll.last.x = -this.winW * 0.1;
    this.scroll.current.y = this.scroll.target.y = this.scroll.last.y = -this.winH * 0.1;
  }

  onWheel(e) {
    e.preventDefault();
    const factor = 0.4;
    this.scroll.target.x -= e.deltaX * factor;
    this.scroll.target.y -= e.deltaY * factor;
  }
  onMouseMove(e) {
    this.mouse.x.t = e.clientX / this.winW;
    this.mouse.y.t = e.clientY / this.winH;
  }
  render() {
    // easing
    this.scroll.current.x += (this.scroll.target.x - this.scroll.current.x) * this.scroll.ease;
    this.scroll.current.y += (this.scroll.target.y - this.scroll.current.y) * this.scroll.ease;

    this.scroll.delta.x.t = this.scroll.current.x - this.scroll.last.x;
    this.scroll.delta.y.t = this.scroll.current.y - this.scroll.last.y;
    this.scroll.delta.x.c += (this.scroll.delta.x.t - this.scroll.delta.x.c) * 0.04;
    this.scroll.delta.y.c += (this.scroll.delta.y.t - this.scroll.delta.y.c) * 0.04;
    this.mouse.x.c += (this.mouse.x.t - this.mouse.x.c) * 0.04;
    this.mouse.y.c += (this.mouse.y.t - this.mouse.y.c) * 0.04;

    // direcciones
    const dirX = this.scroll.current.x > this.scroll.last.x ? 'right' : 'left';
    const dirY = this.scroll.current.y > this.scroll.last.y ? 'down'  : 'up';

    this.items.forEach(item => {
      const newX = 5 * this.scroll.delta.x.c * item.ease + (this.mouse.x.c - 0.5) * item.rect.width * 0.6;
      const newY = 5 * this.scroll.delta.y.c  * item.ease + (this.mouse.y.c - 0.5) * item.rect.height * 0.6;
      const scrollX = this.scroll.current.x;
      const scrollY = this.scroll.current.y;
      const posX = item.x + scrollX + item.extraX + newX;
      const posY = item.y + scrollY + item.extraY + newY;

      // wrap en X
      const beforeX = posX > this.winW;
      const afterX  = posX + item.rect.width < 0;
      if (dirX === 'right' && beforeX) item.extraX -= this.tileSize.w;
      if (dirX === 'left'  && afterX)  item.extraX += this.tileSize.w;

      // wrap en Y
      const beforeY = posY > this.winH;
      const afterY  = posY + item.rect.height < 0;
      if (dirY === 'down' && beforeY) item.extraY -= this.tileSize.h;
      if (dirY === 'up'   && afterY)  item.extraY += this.tileSize.h;

      // aplicar transform
      const fx = item.x + scrollX + item.extraX + newX;
      const fy = item.y + scrollY + item.extraY + newY;
      item.el.style.transform = `translate(${fx}px, ${fy}px)`;
      item.img.style.transform = `scale(1.2) translate(${-this.mouse.x.c * item.ease * 10}%, ${-this.mouse.y.c * item.ease * 10}%)`;
    });

    this.scroll.last.x = this.scroll.current.x;
    this.scroll.last.y = this.scroll.current.y;

    requestAnimationFrame(this.render);
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('wheel', this.onWheel);
  }
}
