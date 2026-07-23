import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Community from "./pages/Community";
import ArticleDetail from "./pages/ArticleDetail";
import Training from "./pages/Training";
import LevelDetail from "./pages/LevelDetail";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import Profile from "./pages/Profile";
import Interactive from "./pages/Interactive";
import Tutorial from "./pages/Tutorial";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/:id" element={<ArticleDetail />} />
        <Route path="/training" element={<Training />} />
        <Route path="/training/:id" element={<LevelDetail />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/interactive" element={<Interactive />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  );
}
