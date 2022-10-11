import React, { Component } from 'react';
//import { Link } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap"


class NavbarAdmin extends Component {
    render() {
        return (
            <div>
                <div className="Admin">This account has administrative rights</div>
                <Navbar bg="dark" variant="dark" expand="lg" className='py-4'>
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
                                <NavDropdown title="Administrative tools" id="basic-nav-dropdown">
                                    <NavDropdown.Item href="/ApproveVoters">Approve Voters</NavDropdown.Item>
                                    <NavDropdown.Item href="/RegisterCandidates">Register Candidates</NavDropdown.Item>
                                    <NavDropdown.Item href="/ElectionResults">See election results</NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item href="/ElectionSessions">Start/Stop an election session</NavDropdown.Item>
                                </NavDropdown>
                            </Nav>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>
            </div>
        );
    }
}

export default NavbarAdmin;