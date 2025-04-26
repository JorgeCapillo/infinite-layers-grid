import '../../styles/index.scss';
import '../../styles/pages/index.scss';
import InfiniteGrid from '../components/infinite-grid';

export default class Index {
  constructor() {
    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
    this.initGrid();
    
    this.sources = [
      'image-1.jpg',
      'image-2.jpg',
      'image-3.jpg',
      'image-4.jpg',
      'image-5.jpg',
      'image-6.jpg',
      'image-7.jpg',
      'image-8.jpg',
      'image-9.jpg',
    ];
    this.data = [
      {x: 71, y: 58, w: 400, h: 270},
      {x: 211, y: 255, w: 540, h: 360},
      {x: 631, y: 158, w: 400, h: 270},
      {x: 1191, y: 245, w: 260, h: 195},
      {x: 351, y: 687, w: 260, h: 290},
      {x: 751, y: 824, w: 205, h: 154},
      {x: 911, y: 540, w: 260, h: 350},
      {x: 1051, y: 803, w: 400, h: 300},
      {x: 71, y: 922, w: 350, h: 260},
    ]
    new InfiniteGrid({
      el: document.querySelector('#images'),
      sources: this.sources,
      data: this.data,
      originalSize: {w: 1522, h: 1238},
    })
  }
  initGrid() {
    document.addEventListener('keydown', (e) => {
      if(e.shiftKey && e.key === 'G') {
        document.getElementById('grid').classList.toggle('show')
      }
    })
  }
  resize() {
    document.documentElement.style.setProperty('--rvw', `${document.documentElement.clientWidth / 100}px`);
  }
}
window.addEventListener('load', () => {
  new Index();
});