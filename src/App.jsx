import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { Header } from "./components/Header";
import { PreviewPage } from "./pages/Preview";
import { DownloadPage } from "./pages/DownloadPage";

function App() {
  return (
    <BrowserRouter>
      <RoutesWrapper>
        <Routes>
          <Route path="/" element={<HomePage></HomePage>}></Route>
          <Route path="/upload-preview" element={<PreviewPage />}></Route>
          <Route path="/download-page" element={<DownloadPage />}></Route>
        </Routes>
      </RoutesWrapper>
    </BrowserRouter>
  );
}

function RoutesWrapper({ children }) {
  return (
    <div className="h-full bg-cover ">
      <Header></Header>
      <div className="h-full px-12 mt-4">{children}</div>
    </div>
  );
}

export default App;
