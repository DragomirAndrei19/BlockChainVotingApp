import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts"



export default function PieChart(props) {


    const [candidatesNames, setCandidatesNames] = useState([]);
    const [candidatesVotes, setCandidatesVotes] = useState([]);
    const [selectedConstituency, setSelectedConstituency] = useState([]);


    useEffect(() => {

        setCandidatesNames(props.candidatesNames);

        var votesIntArray = props.decryptedVotes.map(Number);

        setCandidatesVotes(votesIntArray);
        setSelectedConstituency(props.selectedConstituency);
    })




    return (
        <React.Fragment>

            <div className="container-fluid mb-3">
                <h3 className="mt-3">Graphical result in constituency number {selectedConstituency}</h3>

                <Chart
                    type="donut"
                    height={600}

                    


                    series={candidatesVotes}
                    options={{

                        dataLabels: {
                            enabled: true,
                            style: {
                                fontSize: "30px",
                                fontFamily: "Helvetica, Arial, sans-serif",
                                fontWeight: "bold"
                            }
                        },
                        

                        

                        legend: {
                            fontSize: "32px"
                        },





                        noData: { text: "Empty data" },






                        labels: candidatesNames,
                        responsive: [{
                            breakpoint: 480,
                            options: {
                                chart: {
                                    width: 600
                                },
                                legend: {
                                    position: 'bottom'
                                }
                            }
                        }]
                    }

                    


                    }

                ></Chart>
            </div>
        </React.Fragment>
    )
}
