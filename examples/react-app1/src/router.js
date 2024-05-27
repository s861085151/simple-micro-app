import React, { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Page1 from "./pages/page1";

const Page2 = lazy(() =>
  import(/* webpackChunkName: "page2" */ "./pages/page2")
);

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Page1 />,
    },
    {
      path: "/page2",
      element: (
        <Suspense fallback={<div>Loading...</div>}>
          <Page2 />
        </Suspense>
      ),
    },
  ], {
    basename: "/react17"
  }
);

function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;

// export default AppRouter;

// import React, { lazy, Suspense } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Page1 from "./pages/page1";

// const Page2 = lazy(() =>
//   import(/* webpackChunkName: "page2" */ "./pages/page2")
// );

// function App() {
//   return (
//     <Router basename="/react17">
//       <Routes>
//         <Route index element={Page1} />
//         <Route path="about" element={<Suspense fallback={<div>Loading...</div>}>
//           <Page2 />
//         </Suspense>} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;


// export default AppRouter;