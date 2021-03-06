import React from 'react';
import { StaggeredMotion, Motion, spring } from 'react-motion';
import element from './App.css';

class App extends React.Component {
    constructor() {
        super();

        this.state = {
            pointer: [-10,10],
            delta: [0,0],
            speed: [0,0],
            isPressed: false,
            messages: 4,
            position: 'left'
        };
      
        this._vW = window.innerWidth;
        this._vH = window.innerHeight;

        this._xHover = 0;
        this._yHover = 0;

        this._snapped = false;
        this._dumped = false;

        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchMove = this._handleTouchMove.bind(this);
        this._handlePointerMove = this._handlePointerMove.bind(this);
        this._handlePointerDown = this._handlePointerDown.bind(this);
        this._handlePointerUp = this._handlePointerUp.bind(this);
        this._changeMessages = this._changeMessages.bind(this);
        this._getStyles = this._getStyles.bind(this);
    }

    componentDidMount() {
        window.addEventListener('touchmove', this._handleTouchMove);
        window.addEventListener('touchend', this._handlePointerUp);
        window.addEventListener('mousemove', this._handlePointerMove);
        window.addEventListener('mouseup', this._handlePointerUp);
    }

    // Conveyts touch start to generic pointer down
    _handleTouchStart(pressLocation, e) {
        this._handlePointerDown(pressLocation, e.touches[0]);
    }

    // Conveys touch move event to generic pointer move
    _handleTouchMove(e) {
        e.preventDefault();
        this._handlePointerMove(e.touches[0]);
    }

    // When pointer moves set position and speed
    _handlePointerMove({pageX, pageY}) {
        const {isPressed, pointer: [px, py], delta: [dx, dy]} = this.state;

        if (isPressed) {

            // Pointer position is the coordinate - offset
            const pointer = [pageX - dx, pageY - dy];

            // Pointer speed is the difference between current and previous values
            const speed = [pointer[0] - px, pointer[1] - py];
            this.setState({pointer: pointer, speed: speed});
        }
    }

    // When pointer is pressed we set the offsets
    _handlePointerDown([pressX, pressY], {pageX, pageY}) {
        this.setState({
            isPressed: true,
            delta: [pageX - pressX, pageY - pressY],
            pointer: [pressX, pressY]
        });
    }

    // Handles touch finished
    _handlePointerUp() {      
        const vW = this._vW;
        const vH = this._vH;
        let x = 0;
        let y = 0;
        let position = 'left';

        // If pointer flicks to the right snap right
        if (this.state.speed[0] > 7) {
            x = vW - 50;
          
        // If mouse flicks to the left snap left
        } else if (this.state.speed[0] < -7) {
            x = -10;
          
        // Snap right or left
        } else {
            x = this.state.pointer[0] < vW / 2 ? -10 : vW - 50;
        }

        // If dumped on X
        if (this._snapped) {
          this._dumped = true;
          this.setState({messages: 0});
        }

        position = x === -10 ? 'left' : 'right';
        
        // Limit vertically
        if (this.state.pointer[1] < 10) {
            y = 10;
        } else if (this.state.pointer[1] > vH) {
            y = vH - 50;
        } else {
            y = this.state.pointer[1];
        }

        this.setState({isPressed: false, delta: [0, 0], pointer: [x, y], position: position});
    }
  
    _changeMessages(amount) {
      this._dumped = false;
      this.setState({messages: this.state.messages + amount});
    }

    _getStyles(prevStyles) {
      // `prevStyles` is the interpolated value of the last tick
      const endValue = prevStyles.map((_, i) => {
        const springSettingsTrail = {
          stiffness: 200,
          damping: 18
        };
        const springSettingsMain = {
          stiffness: 200,
          damping: 12
        };

        const magnetStrength = 75;

        let x = this.state.pointer[0];
        let y = this.state.pointer[1];

        if (!this._dumped) {
          if (this.state.position === 'left') {
            x = this.state.messages < 1 ? x - 100 : x; 
          }

          if (this.state.position === 'right') {
            x = this.state.messages < 1 ? x + 100 : x; 
          }
        } else {
          y = this._vH + 200;
        }

        // Snap to X logic
        if (  (Math.abs(x - ((this._vW / 2) + this.xHover)) < magnetStrength) && (Math.abs(y - (this._vH - 135)) < magnetStrength)  ) {
          x = (this._vW / 2) + this.xHover - 3;
          y = this._vH - 129;

          this._snapped = true;

        } else {
          this._snapped = false;
        }

        if (this._dumped) x = this._vW / 2;

        return i === 0
          ? {
              x: spring(x, springSettingsMain),
              y: spring(y, springSettingsMain)
          }
          : {
              x: spring(prevStyles[i - 1].x, springSettingsTrail),
              y: spring(prevStyles[i - 1].y, springSettingsTrail),
            };
      });

      return endValue;
    }

    render() {
        // X follow heads logic
        const extent = 10;
        this.xHover = this.state.pointer[0] < this._vW / 2
        ? -((this._vW / 2 - this.state.pointer[0]) / extent)
        : ((this.state.pointer[0] - (this._vW / 2)) / extent);
        this.xHover = this.xHover - 25;
        this.yHover = -25;

        return (
            <div>
                <StaggeredMotion
                  defaultStyles={[1,2,3].map(() => ({x: 0, y: 0}))}
                  styles={this._getStyles}>
                  {balls =>
                    <div>
                      {balls.map(({x, y}, i) =>
                        <div
                            key={i}
                            onMouseDown={this._handlePointerDown.bind(null, [x, y])}
                            onTouchStart={this._handleTouchStart.bind(null, [x, y])}
                            className={element.elem}
                            style={{
                                left: x + 'px',
                                top: y + 'px',
                                zIndex: balls.length - i}
                            }>
                                <div className={element.chatHead}/>
                                <div className={element.chatCounter + ' ' + element[this.state.position]}>{this.state.messages}</div>
                        </div>
                      )}
                    </div>
                  }
                </StaggeredMotion>
                <button onClick={this._changeMessages.bind(this,  1)}>Add</button>
                <button onClick={this._changeMessages.bind(this, -1)}>Remove</button>

                <Motion
                    defaultStyle={{x: -25, y: -25, binY: 200}}
                    style={{
                      x: spring(this.xHover),
                      y: spring(this.yHover),
                      binY: spring((this.state.isPressed ? 0 : 200))
                    }}>
                    {interpolatingStyle =>
                <div className={element.bin} style={{transform: 'translateY(' + interpolatingStyle.binY + 'px)'}}>
                   <div className={element.xcontainer + ' ' + (this._snapped ? element.snapped : '')} style={{transform: 'translate('+interpolatingStyle.x+'px, '+interpolatingStyle.y+'px)'}}>
                      <div className={element.xcircle}></div>
                      <div className={element.xicon}>X</div>
                    </div>
                </div>}
              </Motion>
            </div>
        );
    }
}

export default App;
