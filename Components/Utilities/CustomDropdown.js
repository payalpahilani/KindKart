// CustomDropdown.js
import React from "react";
import { StyleSheet } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function CustomDropdown({
  data,
  value,
  onChange,
  placeholder,
  testID,
}) {
  return (
    <Dropdown
      style={styles.dropdown}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      itemTextStyle={styles.itemTextStyle}
      iconStyle={styles.iconStyle}
      data={data}
      maxHeight={220}
      labelField="label"
      valueField="value"
      placeholder={placeholder}
      value={value}
      onChange={(item) => onChange(item.value)}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  dropdown: {
    height: 48,
    borderColor: "#DCE3E9",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafb",
    marginBottom: 2,
    justifyContent: "center",
  },
  placeholderStyle: {
    fontSize: 15,
    color: "#888",
  },
  selectedTextStyle: {
    fontSize: 15,
    color: "#222",
  },
  itemTextStyle: {
    fontSize: 15,
    color: "#222",
  },
  iconStyle: {
    width: 24,
    height: 24,
    tintColor: "#888",
  },
});
