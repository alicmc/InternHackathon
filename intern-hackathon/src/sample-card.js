import React, { useState } from "react";
import { useCSVReader, formatFileSize } from "react-papaparse";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Container, Row, Col, Card } from "react-bootstrap";

export function SampleCard() {
  return (
    <Card className="This my card">
      <Card.Body></Card.Body>
    </Card>
  );
}
