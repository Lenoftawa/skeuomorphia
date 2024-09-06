export default function AtmNew() {
    
    return (
      <div className="container">
        <div className="flex-left">
          <div className="button2"> </div>
          <div className="button2"> </div>
          <div className="button2"> </div>
          <div className="button2"> </div>
        </div>
        <div className="flex">
          <div className="button1"> </div>
          <div className="button1"> </div>
          <div className="button1"> </div>
          <div className="button1"> </div>
        </div>
        <div className="computer-container">
          <div className="monitor">
  
            <div className="monitor-inner">          
              <div className="screen-container"><p>Screen here</p>
                
                <div className="screen"></div>
              </div>
            </div>
            
          </div>
          <div className="monitor-base">
            <div className="wheels-parent">
              <div className="wheel"></div>
              <div className="wheel"></div>
            </div>
          </div>
          <div className="monitor-holder-container">
            <div className="monitor-holder">
              <div className="monitor-holder-inner"></div>
              <div className="monitor-holder-inner-front"></div>
              <div className="monitor-holder-inner-front bottom"></div>
            </div>
            <div className="monitor-holder-front"></div>
          </div>
        </div>
      </div>
    );
  }