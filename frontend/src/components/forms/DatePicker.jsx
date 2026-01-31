import React from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { useTheme } from "../../context/theme";

const DatePicker = ({
  label,
  name,
  value,
  onChange,
  min,
  max,
  wrapperStyle = {},
}) => {
  const t = useTheme();

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
    ...wrapperStyle,
  };

  const parsedValue =
    value && dayjs(value).isValid() ? dayjs(value) : null;

  const minDate =
    min && dayjs(min).isValid() ? dayjs(min) : undefined;
  const maxDate =
    max && dayjs(max).isValid() ? dayjs(max) : undefined;

  const handleChange = (newValue) => {
    if (!onChange) return;

    if (!newValue || !dayjs(newValue).isValid()) {
      onChange("");
      return;
    }

    onChange(dayjs(newValue).format("YYYY-MM-DD"));
  };

  return (
    <div style={fieldWrapperStyle}>
      {label && (
        <label style={labelStyle} htmlFor={name}>
          {label}
        </label>
      )}

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MuiDatePicker
          value={parsedValue}
          onChange={handleChange}
          minDate={minDate}
          maxDate={maxDate}
          slotProps={{
            popper: {
              placement: "bottom-end",
            },
            textField: {
              id: name,
              name,
              fullWidth: true,
              placeholder: "MM/DD/YYYY",
              size: "small",
              sx: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontFamily: t.font.family,
                  fontSize: t.font.size.md,
                  backgroundColor: "transparent",
                },
                "& .MuiOutlinedInput-input": {
                  padding: t.spacing(2.5),
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: t.colors.blackBorder,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: t.colors.blackBorder,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: t.colors.blackBorder,
                  borderWidth: 1,
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "#9ca3af",
                  opacity: 1,
                },
              },
            },
            desktopPaper: {
              sx: {
                borderRadius: "16px",
                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.15)",
                border: `1px solid ${t.colors.cardBorder}`,
                backgroundColor: "#ffffff",
                color: "#111827",
              },
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
};

DatePicker.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  min: PropTypes.string,
  max: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  wrapperStyle: PropTypes.object,
};

DatePicker.defaultProps = {
  label: "",
  value: "",
  onChange: undefined,
  min: undefined,
  max: undefined,
  wrapperStyle: {},
};

export default DatePicker;


