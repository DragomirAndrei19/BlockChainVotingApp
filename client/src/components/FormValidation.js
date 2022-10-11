import React from "react";

export const FormValidation = ({ FormValidation }) => {
    <div className="FormValidation">
        {Object.keys(FormValidation).map((fieldName, i) => {
            if (FormValidation[fieldName].length > 0) {
                return (
                    <p class="alert alert-danger" key={i}>{fieldName} {FormValidation[fieldName]}</p>
                )
            } else {
                return '';
            }
        })}
    </div>
}