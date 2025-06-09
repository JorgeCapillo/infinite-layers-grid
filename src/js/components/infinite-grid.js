import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(SplitText);

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

    this.isDragging = false;
    this.drag = { startX: 0, startY: 0, scrollX: 0, scrollY: 0 };

    this.mouse = {
      x: { t: 0.5, c: 0.5 },
      y: { t: 0.5, c: 0.5 },
      press: { t: 0, c: 0 },
    };

    this.items = [];

    this.onResize     = this.onResize.bind(this);
    this.onWheel      = this.onWheel.bind(this);
    this.onMouseMove  = this.onMouseMove.bind(this);
    this.onMouseDown  = this.onMouseDown.bind(this);
    this.onMouseUp    = this.onMouseUp.bind(this);
    this.render       = this.render.bind(this);

    window.addEventListener('resize', this.onResize);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('mousemove', this.onMouseMove);
    this.$container.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('visible', entry.isIntersecting);
      });
    });

    this.onResize();
    this.render();
    this.initIntro();
    this.intro();
  }

  initIntro() {
    this.introItems = [...this.$container.querySelectorAll('.item-wrapper')].filter((item) => {
      const rect = item.getBoundingClientRect();
      return (
        rect.x > -rect.width &&
        rect.x < window.innerWidth + rect.width &&
        rect.y > -rect.height &&
        rect.y < window.innerHeight + rect.height
      );
    });
    this.introItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const x = -rect.x + window.innerWidth * 0.5 - rect.width * 0.5;
      const y = -rect.y + window.innerHeight * 0.5 - rect.height * 0.5;
      gsap.set(item, { x, y });
    });
  }

  intro() {
    gsap.to(this.introItems.reverse(), {
      duration: 2,
      ease: 'expo.inOut',
      x: 0,
      y: 0,
      stagger: 0.05,
    });
  }

  onResize() {
    this.winW = window.innerWidth;
    this.winH = window.innerHeight;

    this.tileSize = {
      w: this.winW,
      h: (this.winW) * (this.originalSize.h / this.originalSize.w),
    };

    this.scroll.current = { x: 0, y: 0 };
    this.scroll.target  = { x: 0, y: 0 };
    this.scroll.last    = { x: 0, y: 0 };

    this.$container.innerHTML = '';

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

    this.items = [];
    const repsX = [0, this.tileSize.w];
    const repsY = [0, this.tileSize.h];

    baseItems.forEach(base => {
      repsX.forEach(offsetX => {
        repsY.forEach(offsetY => {
          const el = document.createElement('div');
          el.classList.add('item');
          el.style.width = `${base.w}px`;

          const wrapper = document.createElement('div');
          wrapper.classList.add('item-wrapper');
          el.appendChild(wrapper);

          const itemImage = document.createElement('div');
          itemImage.classList.add('item-image');
          itemImage.style.width = `${base.w}px`;
          itemImage.style.height = `${base.h}px`;
          wrapper.appendChild(itemImage);

          const img = new Image();
          img.src = `./img/${base.src}`;
          itemImage.appendChild(img);

          const caption = document.createElement('small');
          caption.innerHTML = base.caption;
          const split = new SplitText(caption, { type: 'lines', mask: 'lines', linesClass: 'line' });
          split.lines.forEach((line, i) => {
            line.style.transitionDelay = `${i * 0.15}s`;
            line.parentElement.style.transitionDelay = `${i * 0.15}s`;
          });
          wrapper.appendChild(caption);
          this.$container.appendChild(el);
          this.observer.observe(caption);

          this.items.push({
            el,
            container: itemImage,
            wrapper,
            img,
            x: base.x + offsetX,
            y: base.y + offsetY,
            w: base.w,
            h: base.h,
            extraX: 0,
            extraY: 0,
            rect: el.getBoundingClientRect(),
            ease: Math.random() * 0.5 + 0.5,
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

  onMouseDown(e) {
    e.preventDefault();
    this.isDragging = true;
    document.documentElement.classList.add('dragging');
    this.mouse.press.t = 1;
    this.drag.startX = e.clientX;
    this.drag.startY = e.clientY;
    this.drag.scrollX = this.scroll.target.x;
    this.drag.scrollY = this.scroll.target.y;
  }

  onMouseUp() {
    this.isDragging = false;
    document.documentElement.classList.remove('dragging');
    this.mouse.press.t = 0;
  }

  onMouseMove(e) {
    this.mouse.x.t = e.clientX / this.winW;
    this.mouse.y.t = e.clientY / this.winH;

    if (this.isDragging) {
      const dx = e.clientX - this.drag.startX;
      const dy = e.clientY - this.drag.startY;
      this.scroll.target.x = this.drag.scrollX + dx;
      this.scroll.target.y = this.drag.scrollY + dy;
    }
  }

  render() {
    this.scroll.current.x += (this.scroll.target.x - this.scroll.current.x) * this.scroll.ease;
    this.scroll.current.y += (this.scroll.target.y - this.scroll.current.y) * this.scroll.ease;

    this.scroll.delta.x.t = this.scroll.current.x - this.scroll.last.x;
    this.scroll.delta.y.t = this.scroll.current.y - this.scroll.last.y;
    this.scroll.delta.x.c += (this.scroll.delta.x.t - this.scroll.delta.x.c) * 0.04;
    this.scroll.delta.y.c += (this.scroll.delta.y.t - this.scroll.delta.y.c) * 0.04;
    this.mouse.x.c += (this.mouse.x.t - this.mouse.x.c) * 0.04;
    this.mouse.y.c += (this.mouse.y.t - this.mouse.y.c) * 0.04;
    this.mouse.press.c += (this.mouse.press.t - this.mouse.press.c) * 0.04;

    const dirX = this.scroll.current.x > this.scroll.last.x ? 'right' : 'left';
    const dirY = this.scroll.current.y > this.scroll.last.y ? 'down'  : 'up';

    this.items.forEach(item => {
      const newX = 5 * this.scroll.delta.x.c * item.ease + (this.mouse.x.c - 0.5) * item.rect.width * 0.6;
      const newY = 5 * this.scroll.delta.y.c * item.ease + (this.mouse.y.c - 0.5) * item.rect.height * 0.6;
      const scrollX = this.scroll.current.x;
      const scrollY = this.scroll.current.y;
      const posX = item.x + scrollX + item.extraX + newX;
      const posY = item.y + scrollY + item.extraY + newY;

      const beforeX = posX > this.winW;
      const afterX = posX + item.rect.width < 0;
      if (dirX === 'right' && beforeX) item.extraX -= this.tileSize.w;
      if (dirX === 'left' && afterX) item.extraX += this.tileSize.w;

      const beforeY = posY > this.winH;
      const afterY = posY + item.rect.height < 0;
      if (dirY === 'down' && beforeY) item.extraY -= this.tileSize.h;
      if (dirY === 'up' && afterY) item.extraY += this.tileSize.h;

      const fx = item.x + scrollX + item.extraX + newX;
      const fy = item.y + scrollY + item.extraY + newY;
      item.el.style.transform = `translate(${fx}px, ${fy}px)`;
      item.img.style.transform = `scale(${1.2 + 0.2 * this.mouse.press.c * item.ease}) translate(${-this.mouse.x.c * item.ease * 10}%, ${-this.mouse.y.c * item.ease * 10}%)`;
    });

    this.scroll.last.x = this.scroll.current.x;
    this.scroll.last.y = this.scroll.current.y;

    requestAnimationFrame(this.render);
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.$container.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.observer.disconnect();
  }
}
