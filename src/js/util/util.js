const isTouch = () => {
  try {
    document.createEvent('TouchEvent');
    return true;
  } catch (e) {
    return false;
  }
}
export default {
  isTouch: isTouch,
}