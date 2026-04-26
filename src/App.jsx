import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { Header } from "./components/Header";
import { PreviewPage } from "./pages/Preview";
import { DownloadPage } from "./pages/DownloadPage";
import {UploadPage} from "./pages/UploadPage"

function App() {
  return (
    <BrowserRouter>
      <RoutesWrapper>
        <Routes>
          <Route path="/" element={<HomePage></HomePage>}></Route>
          <Route path="/upload/:mode" element={<UploadPage/>}></Route>
          <Route path="/preview/:mode" element={<PreviewPage />}></Route>
          <Route path="/download" element={<DownloadPage />}></Route>
        </Routes>
      </RoutesWrapper>
    </BrowserRouter>
  );
}

function RoutesWrapper({ children }) {
  return (
    <div className="h-full bg-cover ">
      <Header></Header>
      <div className="h-full md:px-12 px-4">{children}</div>
    </div>
  );
}

export default App;
