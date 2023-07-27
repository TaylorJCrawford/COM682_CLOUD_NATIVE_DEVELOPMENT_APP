import { HashRouter, BrowserRouter, Switch, Routes, Route } from 'react-router-dom'
// import React from 'react'

import Navbar from './components/Navbar'
import Feed from './components/Feed'
import Form from './components/Forms/Form';
import VideoView from './components/VideoView';
import CommentForm from './components/Forms/CommentForm';
import DeleteVideo from './components/Operations/DeleteVideo';
import SearchFeed from './components/SearchFeed';
import Message from './components/Operations/Message';

const App = () => (

    <BrowserRouter>
        <Navbar />
          <Routes>
            <Route exact path='/' element={<Feed />} />
            <Route exact path='/add' element={<Form title='Add'/>} />
            <Route exact path='/edit/:id' element={<Form title='Edit'/>} /> {/* Edit Video Need To Pass Video ID through */}
            <Route exact path='/video/:id' element={<VideoView />} /> {/* Watch Video */}
            <Route exact path='/video/delete/:id' element={<DeleteVideo />} />
            <Route exact path='/comment/add/:id' element={<CommentForm title='Add'/>} />
            <Route exact path='/search/:term' element={<SearchFeed />} />
            <Route exact path='/message/:message' element={<Message />} />
            <Route exact path='/message/:message/:clipid' element={<Message />} />
          </Routes>
    </BrowserRouter>
  );

export default App