"use client";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef } from "react";

export default function DialogUpdate(props) {
  const {
    setVisible,
    visible,
    valueC,
    valueJava,
    setValueC,
    setValueJava,
    handleSubmit,
    handleSubmitMore,
    disable,
    setDisable,
    text,
    name,
    defautValues,
  } = props;
  const toast = useRef(null);
  const footer = (
    <div className="flex justify-content-center">
      <div className="flex w-8 justify-content-between">
        <Button
          disabled={disable}
          label="OK"
          onClick={() => {
            toast.current.clear();
            text === "One" ? handleSubmit() : handleSubmitMore();
          }}
          className="w-5"
        />
        <Button
          label="Close"
          onClick={() => {
            if (!visible) return;
            setVisible(false);
            setDisable(true);
            toast.current.clear();
          }}
          severity="danger"
          className="w-5"
        />
      </div>
    </div>
  );
  const header = () => {
    return (
      <div className="flex justify-content-center">
        <h4 className="mr-1">Edit</h4> <h4 className="ml-1">{name}/API</h4>
      </div>
    );
  };
  return (
    <div>
      <Toast ref={toast} />
      <Dialog
        header={header}
        footer={footer}
        visible={visible}
        style={{ width: "40vw" }}
        closable={false}
      >
        <div>
          <p className="mb-1 mt-0 font-medium">Java Weight :</p>
          <InputText
            type="number"
            className="w-full border-2"
            value={valueJava === null ? undefined : valueJava}
            onChange={(e) => {
              setValueJava(e.target.value);
              if (
                Number.parseFloat(e.target.value) < 0 ||
                Number.parseFloat(e.target.value) > 100
              ) {
                toast.current.show({
                  severity: "warn",
                  summary: "Warning",
                  detail: "Range from 0 to 100 !",
                  life: 3000,
                });
                setValueC("");
                setDisable(true);
              } else {
                if (
                  Number.parseFloat(e.target.value) ===
                    Number.parseFloat(valueJava) ||
                  Number.parseFloat(e.target.value) ===
                    Number.parseFloat(defautValues.value1) ||
                  e.target.value === defautValues.value1
                ) {
                  setDisable(true);
                } else {
                  setDisable(false);
                }
                if (e.target.value !== "") {
                  setValueC(
                    (100 - Number.parseFloat(e.target.value)).toString()
                  );
                } else {
                  setValueC("");
                }
              }
            }}
          />
          <p className="mb-1 font-medium">C# Weight :</p>
          <InputText
            type="number"
            className="w-full border-2"
            value={valueC === null ? undefined : valueC}
            onChange={(e) => {
              setValueC(e.target.value);
              if (
                Number.parseFloat(e.target.value) < 0 ||
                Number.parseFloat(e.target.value) > 100
              ) {
                toast.current.show({
                  severity: "warn",
                  summary: "Warning",
                  detail: "Range from 0 to 100 !",
                  life: 3000,
                });
                setValueJava("");
                setDisable(true);
              } else {
                if (
                  Number.parseFloat(e.target.value) ===
                    Number.parseFloat(valueC) ||
                  Number.parseFloat(e.target.value) ===
                    Number.parseFloat(defautValues.value2) ||
                  e.target.value === defautValues.value2
                ) {
                  setDisable(true);
                } else {
                  setDisable(false);
                }
                if (e.target.value !== "") {
                  setValueJava(
                    (100 - Number.parseFloat(e.target.value)).toString()
                  );
                } else {
                  setValueJava("");
                }
              }
            }}
          />
        </div>
      </Dialog>
    </div>
  );
}
