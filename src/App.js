import {Navbar} from './navbar';
import {Footer} from './Footer';
import "./main.css";

function App() {
  return (
    <div>
      <Navbar />
      <div className='content-container'>
        <div className='content'>
          Hello
        </div>
      </div>
      <Footer/>
    </div>
  );
}


export default App;
