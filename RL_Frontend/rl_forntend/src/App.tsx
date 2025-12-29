import { Provider } from 'react-redux';
import { store } from './redux/store';
import Home from './pages/Home';
import './styles/globals.css';

function App() {
  return (
    <Provider store={store}>
      <Home />
    </Provider>
  );
}

export default App;
