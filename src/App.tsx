import {Routes, Route, Outlet, Link} from "react-router-dom"
import CounterApp from "./routes/Counter.tsx"
import "./App.css"
import CounterStoreApp from "./routes/CounterMulti.tsx"

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CounterApp />} />
          <Route path="counterStore" element={<CounterStoreApp />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </>
  )
}

function Layout() {
  return (
    <div className="layer vbox">
      {/* A "layout route" is a good place to put markup you want to
          share across all the pages on your site, like navigation. */}
      <nav>
        <ul className="hbox gap(10) p(10)">
          <li>
            <Link to="/">CounterApp</Link>
          </li>
          <li>
            <Link to="/counterStore">counterStore</Link>
          </li>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/nothing-here">Nothing Here</Link>
          </li>
        </ul>
      </nav>

      <hr />

      {/* An <Outlet> renders whatever child route is currently active,
          so you can think about this <Outlet> as a placeholder for
          the child routes we defined above. */}

      <div className="h(fill) pack">
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
    </div>
  )
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  )
}
