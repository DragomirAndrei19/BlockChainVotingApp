import 'bootstrap/dist/css/bootstrap.min.css';
// Importing custom CSS
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from './components/Pages/HomePage';
import RegisterCandidates from './components/Pages/RegisterCandidates';
import CandidatesList from './components/Pages/CandidatesList';
import ApplyToVote from './components/Pages/ApplyToVote';
import ApproveVoters from './components/Pages/ApproveVoters';
import CastVote from './components/Pages/CastVote';
import ElectionResults from './components/Pages/ElectionResults';
import ElectionSessions from './components/Pages/ElectionSessions';
import VotersList from './components/Pages/VotersList';
import PublishedResults from './components/Pages/PublishedResults';


import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; 
import history from "./history";
import EditCandidates from './components/Pages/EditCandidates';


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(

    <Router history={history}>
        <Routes>
            <Route path='/' element={<HomePage/>} />
            <Route path='/RegisterCandidates' element={<RegisterCandidates/>} />
            <Route path='/CandidatesList' element={<CandidatesList/>} />
            <Route path='/ApplyToVote' element={<ApplyToVote/>} />
            <Route path='/ApproveVoters' element={<ApproveVoters/>} />
            <Route path='/CastVote' element={<CastVote/>} />
            <Route path='/ElectionResults' element={<ElectionResults/>} />
            <Route path='/ElectionSessions' element={<ElectionSessions/>} />
            <Route path='/EditCandidates' element={<EditCandidates/>} />
            <Route path='/VotersList' element={<VotersList/>} />
            <Route path='/PublishedResults' element={<PublishedResults/>} />
            
        </Routes>
    </Router>

);


