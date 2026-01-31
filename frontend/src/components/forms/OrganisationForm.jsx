import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/theme";
import { RichTextEditor } from "..";
import building from "../../assets/icons/building.png";
import editIcon from "../../assets/icons/editIcon.png";

const OrganisationFormField = ({
  label,
  name,
  as = "input",
  baseInputStyle,
  labelStyle,
  fieldWrapperStyle,
  inputProps = {},
  inputStyle = {},
  children,
}) => {
  const mergedStyle = { ...baseInputStyle, ...inputStyle };

  const commonProps = {
    id: name,
    name,
    style: mergedStyle,
    ...inputProps,
  };

  const Control =
    as === "select" ? (
      <select {...commonProps}>{children}</select>
    ) : (
      <input {...commonProps} />
    );

  return (
    <div style={fieldWrapperStyle}>
      {label && (
        <label style={labelStyle} htmlFor={name}>
          {label}
        </label>
      )}
      {Control}
    </div>
  );
};

const teamSizeOptions = [
  "1 - 10",
  "11 - 25",
  "26 - 50",
  "51 - 100",
  "101 - 250",
  "250+",
];

const OrganisationForm = ({ formData, onFieldChange }) => {
  const t = useTheme();

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  const handleDescriptionChange = (value) => {
    if (onFieldChange) {
      onFieldChange("description", value);
    }
  };

  const baseInputStyle = {
    width: "100%",
    padding: t.spacing(3),
    borderRadius: "8px",
    border: `1px solid ${t.colors.blackBorder}`,
    backgroundColor: "transparent",
    fontFamily: t.font.family,
    fontSize: t.font.size.md,
    color: "#111827",
    outline: "none",
  };

  const labelStyle = {
    fontSize: t.font.size.sm,
    color: "#111827",
    fontWeight: t.font.weight.medium,
    marginBottom: t.spacing(1),
  };

  const fieldWrapperStyle = {
    display: "flex",
    flexDirection: "column",
    gap: t.spacing(1),
  };

  return (
    <>
      <div
        style={{
          paddingTop: t.spacing(6),
          display: "flex",
          gap: t.spacing(6),
          marginBottom: t.spacing(6),
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: "0 0 240px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: t.spacing(2),
          }}
        >
          <div
            style={{
              position: "relative",
              width: "210px",
              height: "210px",
              borderRadius: "50%",
              border: "2px dashed rgba(15, 23, 42, 0.15)",
              background: "radial-gradient(circle, #f8fafc 0%, #e2e8f0 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 -10px 18px rgba(15, 23, 42, 0.08)",
              overflow: "visible",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "6px",
                left: "6px",
                right: "6px",
                bottom: "6px",
                borderRadius: "50%",
                overflow: "hidden",
              }}
            >
              <img
                src={building}
                alt="Organisation logo"
                style={{
                  position: "absolute",
                  width: "80%",
                  height: "80%",
                  bottom: "-3%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  opacity: 0.2,
                  filter: "grayscale(1)",
                  pointerEvents: "none",
                }}
              />
            </div>
            <button
              type="button"
              style={{
                position: "absolute",
                bottom: "12px",
                right: "12px",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 20px rgba(15, 23, 42, 0.3)",
                cursor: "pointer",
              }}
            >
              <img
                src={editIcon}
                alt="Edit logo"
                style={{ width: "20px", height: "20px" }}
              />
            </button>
          </div>
          <span
            style={{
              color: "#6b7280",
              fontSize: t.font.size.sm,
              textAlign: "center",
            }}
          >
            Upload organisation logo
          </span>
        </div>

        <div
          style={{
            flex: "1 1 420px",
            display: "flex",
            flexDirection: "column",
            gap: t.spacing(4),
          }}
        >
          <OrganisationFormField
            label="Organisation Name"
            name="organisationName"
            baseInputStyle={baseInputStyle}
            labelStyle={labelStyle}
            fieldWrapperStyle={fieldWrapperStyle}
            inputProps={{
              type: "text",
              value: formData.organisationName,
              onChange: handleChange("organisationName"),
              placeholder: "Enter the organisation's name",
            }}
          />
          <OrganisationFormField
            label="Email"
            name="email"
            baseInputStyle={baseInputStyle}
            labelStyle={labelStyle}
            fieldWrapperStyle={fieldWrapperStyle}
            inputProps={{
              type: "email",
              value: formData.email,
              onChange: handleChange("email"),
              placeholder: "Enter the organisation's email",
            }}
          />
          <OrganisationFormField
            label="Contact Number"
            name="contactNumber"
            baseInputStyle={baseInputStyle}
            labelStyle={labelStyle}
            fieldWrapperStyle={fieldWrapperStyle}
            inputProps={{
              type: "text",
              value: formData.contactNumber,
              onChange: handleChange("contactNumber"),
              placeholder: "Enter the organisation's contact number",
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginBottom: t.spacing(4),
          marginLeft: t.spacing(6),
        }}
      >
        <label
          style={{ ...labelStyle, marginLeft: t.spacing(6) }}
          htmlFor="description"
        >
          Description
        </label>
        <RichTextEditor
          id="description"
          value={formData.description}
          placeholder="Provide a short description for the organisation"
          onChange={handleDescriptionChange}
          wrapperStyle={{
            marginTop: t.spacing(1),
          }}
          minHeight={140}
        />
      </div>

      <div
        style={{
          marginBottom: t.spacing(4),
          marginLeft: t.spacing(6),
        }}
      >
        <OrganisationFormField
          label="Team Size"
          name="teamSize"
          as="select"
          baseInputStyle={baseInputStyle}
          labelStyle={labelStyle}
          fieldWrapperStyle={fieldWrapperStyle}
          inputProps={{
            value: formData.teamSize,
            onChange: handleChange("teamSize"),
          }}
          inputStyle={{
            appearance: "none",
            backgroundImage:
              "linear-gradient(45deg, transparent 50%, #94a3b8 50%), linear-gradient(135deg, #94a3b8 50%, transparent 50%)",
            backgroundPosition:
              "calc(100% - 20px) calc(50% - 4px), calc(100% - 12px) calc(50% - 4px)",
            backgroundSize: "8px 8px, 8px 8px",
            backgroundRepeat: "no-repeat",
          }}
        >
          {teamSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </OrganisationFormField>
      </div>

      <div
        style={{
          marginBottom: t.spacing(4),
          marginLeft: t.spacing(6),
        }}
      >
        <OrganisationFormField
          label="Address"
          name="address"
          baseInputStyle={baseInputStyle}
          labelStyle={labelStyle}
          fieldWrapperStyle={fieldWrapperStyle}
          inputProps={{
            type: "text",
            value: formData.address,
            onChange: handleChange("address"),
            placeholder: "Enter the Address",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: t.spacing(4),
          marginBottom: t.spacing(4),
          marginLeft: t.spacing(6),
        }}
      >
        <OrganisationFormField
          label="Country"
          name="country"
          baseInputStyle={baseInputStyle}
          labelStyle={labelStyle}
          fieldWrapperStyle={fieldWrapperStyle}
          inputProps={{
            type: "text",
            value: formData.country,
            onChange: handleChange("country"),
            placeholder: "Enter the country",
          }}
        />
        <OrganisationFormField
          label="State"
          name="state"
          baseInputStyle={baseInputStyle}
          labelStyle={labelStyle}
          fieldWrapperStyle={fieldWrapperStyle}
          inputProps={{
            type: "text",
            value: formData.state,
            onChange: handleChange("state"),
            placeholder: "Enter the state",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: t.spacing(4),
          marginBottom: t.spacing(6),
          marginLeft: t.spacing(6),
        }}
      >
        <OrganisationFormField
          label="City"
          name="city"
          baseInputStyle={baseInputStyle}
          labelStyle={labelStyle}
          fieldWrapperStyle={fieldWrapperStyle}
          inputProps={{
            type: "text",
            value: formData.city,
            onChange: handleChange("city"),
            placeholder: "Enter the city",
          }}
        />
        <OrganisationFormField
          label="Pincode"
          name="pincode"
          baseInputStyle={baseInputStyle}
          labelStyle={labelStyle}
          fieldWrapperStyle={fieldWrapperStyle}
          inputProps={{
            type: "text",
            value: formData.pincode,
            onChange: handleChange("pincode"),
            placeholder: "Enter the pincode",
          }}
        />
      </div>
    </>
  );
};

OrganisationForm.propTypes = {
  formData: PropTypes.shape({
    organisationName: PropTypes.string,
    email: PropTypes.string,
    contactNumber: PropTypes.string,
    description: PropTypes.string,
    teamSize: PropTypes.string,
    address: PropTypes.string,
    country: PropTypes.string,
    state: PropTypes.string,
    city: PropTypes.string,
    pincode: PropTypes.string,
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
};

export default OrganisationForm;
