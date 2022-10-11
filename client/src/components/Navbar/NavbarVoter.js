import React, { Component } from 'react';
//import { Link } from 'react-router-dom';
import {Navbar, Nav, Container} from "react-bootstrap"

class NavbarVoter extends Component {
    render() {
        return (
            <div>
                <Navbar bg="dark" variant="dark" expand="lg">
                    <Container>
                        <Navbar.Brand href="/">BlockVoter</Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" />
                        <Navbar.Collapse id="basic-navbar-nav">
                            <Nav className="me-auto">
                                <Nav.Link href="/">Home Page</Nav.Link>
                                <Nav.Link href="/CandidatesList">List of candidates</Nav.Link>
                                <Nav.Link href="/VotersList">List of voters</Nav.Link>
                                <Nav.Link href="/ApplyTovOTE">Apply to vote</Nav.Link>
                                <Nav.Link href="/CastVote">Cast your vote</Nav.Link>
                                <Nav.Link href="/PublishedResults">Published Results</Nav.Link>
                            </Nav>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>
            </div>
        );
    }
}

export default NavbarVoter;