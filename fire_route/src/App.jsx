import { Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import IGuide from './pages/IGuide'
import Gallery from './pages/Gallery'
import Cottage from './pages/Cottage'
import Activities from './pages/Activities'

export default function App() {
  return (
    <>
      <div className="bg-gradient" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/iguide" element={<IGuide />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/cottage" element={<Cottage />} />
        <Route path="/activities" element={<Activities />} />
      </Routes>
    </>
  )
}
