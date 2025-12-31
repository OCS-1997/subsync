import { Routes, Route } from "react-router-dom";
import ArticleListRefactored from "./pages/ArticleListRefactored.jsx";
import ArticleView from "./pages/ArticleView.jsx";
import ArticleEditor from "./pages/ArticleEditor.jsx";
import CategoryManagement from "./pages/CategoryManagement.jsx";

export default function KnowledgeBaseRoutes() {
    return (
        <Routes>
            <Route path="/" element={<ArticleListRefactored />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/new" element={<ArticleEditor />} />
            <Route path="/:id" element={<ArticleView />} />
            <Route path="/:id/edit" element={<ArticleEditor />} />
        </Routes>
    );
}
