"use client";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import YAML from "yaml";
import { useEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import DialogUpdate from "@/component/DialogUpdate";
export default function Home() {
  const [products, setProducts] = useState([]);
  const [data, setData] = useState({});
  const [renderData, setRenderData] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [visible, setVisible] = useState(false);
  const [valueJava, setValueJava] = useState(0);
  const [valueC, setValueC] = useState(0);
  const [text, setText] = useState();
  const [file, setFile] = useState(null);
  const [disable, setDisable] = useState(true);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  let vs = null;
  let fileUploaderRef = null;
  const toast = useRef(null);
  useEffect(() => {
    // console.log(products);
    setProducts([...products]);
  }, [!renderData]);
  function readYamlFile(e) {
    document.getElementById("output").textContent = e.target.result;
    vs = YAML.parse(e.target.result);
    setFile(YAML.parse(e.target.result));
    let http = vs.spec.http;
    // todo: http.length
    let arr = [];
    http.forEach(function (value, index, array) {
      let pos = "corsPolicy:" + index;
      let match = value.match;
      let merged = match.length > 1;
      if (match.length > 1) {
        merged = true;
      }

      let weightC = null;
      let weightJ = null;
      let domain = null;

      let route = value.route;
      if (route < 1 || route > 3) {
        //TODO warning
      } else {
        let host1 = route[0].destination.host;
        let weight1 = route[0].weight;
        let host2 = "";
        let weight2 = null;
        if (weight1 == undefined) {
          weight1 = -100;
        }

        if (route.length == 2) {
          host2 = route[1].destination.host;
          weight2 = route[1].weight;
          if (weight2 == undefined) {
            weight2 = -100;
          }
        }

        if (host1.endsWith(".ewallet-gateway.svc.cluster.local")) {
          domain = host1.replace(".ewallet-gateway.svc.cluster.local", "");
          weightJ = weight1;
        } else if (host2.endsWith(".ewallet-gateway.svc.cluster.local")) {
          domain = host2.replace(".ewallet-gateway.svc.cluster.local", "");
          weightJ = weight2;
        }

        if (host1 === "ewallet-epay-new.sacombank.local") {
          weightC = weight1;
        } else if (host2 === "ewallet-epay-new.sacombank.local") {
          weightC = weight2;
        }
      }

      match.forEach(function (valueMatch, indexMatch, arrayMatch) {
        let reqFunc = valueMatch.headers["request-func"];
        let toDomain = valueMatch.headers.toDomain;
        let apiName = "[not found]";
        if (reqFunc != undefined) {
          apiName = reqFunc.exact;
        } else if (toDomain != undefined) {
          apiName = "toDomain:" + toDomain.exact;
        }

        if (apiName == undefined) {
          console.log();
        }

        let rowData = {
          ordNumber: index,
          position: pos,
          api: apiName,
          domain: domain,
          javaWeight: weightJ,
          csWeight: weightC,
          merged: merged,
        };
        arr.push(rowData);
      });
    });
    setProducts(arr);
    console.log();
  }
  const updateBodyTemplate = (rowData) => {
    return (
      <>
        <Button
          label="Edit"
          onClick={() => {
            setData(rowData);
            setVisible(true);
            setValueC(rowData["csWeight"]);
            setValueJava(rowData["javaWeight"]);
            setText("One");
          }}
          severity="info"
        />
      </>
    );
  };
  const handleSubmit = () => {
    if (data["api"] === "") {
    } else {
      let obj = [];
      let http = file.spec.http;
      http.forEach((value, index, array) => {
        let match = value.match;
        match.forEach((valueMatch, indexMatch, arrayMatch) => {
          let reqFunc = valueMatch.headers["request-func"];
          let reqToDomain = valueMatch.headers.toDomain;
          if (reqFunc !== undefined && reqToDomain === undefined) {
            if (reqFunc["exact"] === data["api"]) {
              arrayMatch.forEach((item) => {
                products.forEach((product) => {
                  if (
                    item.headers["request-func"]["exact"] !== undefined &&
                    product["api"] === item.headers["request-func"]["exact"]
                  ) {
                    product["javaWeight"] =
                      valueJava === ""
                        ? undefined
                        : Number.parseFloat(valueJava);
                    product["csWeight"] =
                      valueC === "" ? undefined : Number.parseFloat(valueC);
                    setRenderData(!renderData);
                    setVisible(false);
                    setDisable(true);
                    setSelectedProducts([]);
                  }
                });
              });
              let domain = "";
              if (
                value.route[0].destination.host.endsWith(
                  ".ewallet-gateway.svc.cluster.local"
                )
              ) {
                domain = value.route[0].destination.host.replace(
                  ".ewallet-gateway.svc.cluster.local",
                  ""
                );
              } else if (
                value.route[1].destination.host.endsWith(
                  ".ewallet-gateway.svc.cluster.local"
                )
              ) {
                domain = value.route[1].destination.host.replace(
                  ".ewallet-gateway.svc.cluster.local",
                  ""
                );
              }

              obj = [
                {
                  destination: {
                    host: "ewallet-epay-new.sacombank.local",
                    port: { number: 80 },
                  },
                  weight: valueC === "" ? undefined : Number.parseFloat(valueC),
                },
                {
                  destination: {
                    host: domain + ".ewallet-gateway.svc.cluster.local",
                    port: { number: 8080 },
                  },
                  weight:
                    valueJava === "" ? undefined : Number.parseFloat(valueJava),
                },
              ];
              console.log(YAML.stringify(obj, 10));
              value.route = obj;
              toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "Edit Success !",
                life: 3000,
              });
            }
          } else if (reqToDomain !== undefined) {
            if (reqToDomain["exact"] === data["api"].split(":")[1]) {
              products.forEach((product) => {
                if (product["api"] === data["api"]) {
                  product["javaWeight"] =
                    valueJava === "" ? undefined : Number.parseFloat(valueJava);
                  product["csWeight"] =
                    valueC === "" ? undefined : Number.parseFloat(valueC);
                  setRenderData(!renderData);
                  setVisible(false);
                  setDisable(true);
                  setSelectedProducts([]);
                }
              });
              let domain = "";
              obj = [
                {
                  destination: {
                    host: "ewallet-epay-new.sacombank.local",
                    port: { number: 80 },
                  },
                  weight: valueC === "" ? undefined : Number.parseFloat(valueC),
                },
                {
                  destination: {
                    host: domain + ".ewallet-gateway.svc.cluster.local",
                    port: { number: 8080 },
                  },
                  weight:
                    valueJava === "" ? undefined : Number.parseFloat(valueJava),
                },
              ];
              console.log(YAML.stringify(obj, 10));
              value.route = obj;
              toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "Edit Success !",
                life: 3000,
              });
            }
          }
        });
      });
    }
  };
  const handleSubmitMore = () => {
    let obj = [];
    let http = file.spec.http;
    http.forEach((value, index, array) => {
      let match = value.match;
      match.forEach((valueMatch, indexMatch, arrayMatch) => {
        let reqFunc = valueMatch.headers["request-func"];
        let reqToDomain = valueMatch.headers.toDomain;
        if (reqFunc !== undefined && reqToDomain === undefined) {
          selectedProducts.forEach((item) => {
            if (reqFunc["exact"] === item["api"]) {
              arrayMatch.forEach((item) => {
                products.forEach((product) => {
                  if (
                    item.headers["request-func"]["exact"] !== undefined &&
                    item.headers["request-func"]["exact"] === product["api"]
                  ) {
                    product["javaWeight"] = valueJava;
                    product["csWeight"] = valueC;
                    setRenderData(!renderData);
                    setSelectedProducts([]);
                    setVisible(false);
                    setDisable(true);
                  }
                });
              });
              let domain = "";
              if (
                value.route[0].destination.host.endsWith(
                  ".ewallet-gateway.svc.cluster.local"
                )
              ) {
                domain = value.route[0].destination.host.replace(
                  ".ewallet-gateway.svc.cluster.local",
                  ""
                );
              } else if (
                value.route[1].destination.host.endsWith(
                  ".ewallet-gateway.svc.cluster.local"
                )
              ) {
                domain = value.route[1].destination.host.replace(
                  ".ewallet-gateway.svc.cluster.local",
                  ""
                );
              }
              obj = [
                {
                  destination: {
                    host: "ewallet-epay-new.sacombank.local",
                    port: { number: 80 },
                  },
                  weight: valueC === "" ? undefined : Number.parseFloat(valueC),
                },
                {
                  destination: {
                    host: domain + ".ewallet-gateway.svc.cluster.local",
                    port: { number: 8080 },
                  },
                  weight:
                    valueJava === "" ? undefined : Number.parseFloat(valueJava),
                },
              ];
              console.log(YAML.stringify(obj, 10));
              value.route = obj;
            }
          });
        } else if (reqToDomain !== undefined) {
          selectedProducts.forEach((select) => {
            if (reqToDomain["exact"] === select["api"].split(":")[1]) {
              products.forEach((product) => {
                if (product["api"] === select["api"]) {
                  product["javaWeight"] =
                    valueJava === "" ? undefined : Number.parseFloat(valueJava);
                  product["csWeight"] =
                    valueC === "" ? undefined : Number.parseFloat(valueC);
                  setRenderData(!renderData);
                  setVisible(false);
                  setDisable(true);
                  setSelectedProducts([]);
                }
              });
              let domain = "";
              obj = [
                {
                  destination: {
                    host: "ewallet-epay-new.sacombank.local",
                    port: { number: 80 },
                  },
                  weight: valueC === "" ? undefined : Number.parseFloat(valueC),
                },
                {
                  destination: {
                    host: domain + ".ewallet-gateway.svc.cluster.local",
                    port: { number: 8080 },
                  },
                  weight:
                    valueJava === "" ? undefined : Number.parseFloat(valueJava),
                },
              ];
              value.route = obj;
            }
          });
        }
      });
    });
    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "Edit Successed !",
      life: 3000,
    });
  };
  const handleExport = () => {
    if (file === null && products.length === 0) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "There are no files to export !",
        life: 3000,
      });
    } else {
      alert("Are you sure ?");
      let blob = new Blob([YAML.stringify(file, 10)], {
        type: "application/x-yaml",
      });
      let url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("download", file.metadata.name + ".yaml");
      link.href = url;
      link.click();
      document.getElementById("output").textContent = YAML.stringify(file, 10);
    }
  };
  return (
    <div className="w-full flex justify-content-center align-items-center">
      <Toast ref={toast} />
      <div className="w-11">
        <div className="w-full flex justify-content-between mt-5">
          <div className="flex align-items-center">
            <FileUpload
              ref={(ref) => {
                fileUploaderRef = ref;
              }}
              name="inputfile"
              id="inputfile"
              mode="basic"
              accept=".yaml,.yml,.txt"
              onSelect={(e) => {
                console.log(e.files[0]["name"].split(".")[1]);
                if (
                  e.files[0]["name"].split(".")[1] === "yaml" ||
                  e.files[0]["name"].split(".")[1] === "yml" ||
                  e.files[0]["name"].split(".")[1] === "text"
                ) {
                  let fr = new FileReader();
                  fr.onload = readYamlFile;
                  fr.readAsText(e.files[0]);
                } else {
                  toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Incorrect .yaml format !",
                    life: 3000,
                  });
                  fileUploaderRef.clear();
                }
              }}
            />
            <Button
              label="Export"
              className="ml-3"
              severity="secondary"
              icon="pi pi-download"
              onClick={handleExport}
            />
          </div>
          <Button
            icon="pi pi-pencil"
            label="Edit"
            onClick={() => {
              if (selectedProducts.length > 0) {
                setVisible(true);
                setValueC(null);
                setValueJava(null);
                setText("More");
              } else {
                toast.current.show({
                  severity: "error",
                  summary: "Error",
                  detail: "There are no boxes selected !",
                  life: 3000,
                });
              }
            }}
            severity="info"
            className="w-1"
          />
        </div>
        <div className="mt-4 w-full flex justify-content-between border-500 surface-200 border-1 border-round p-5">
          <div className="w-full">
            <span className="p-input-icon-right">
              <InputText
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    global: {
                      value: e.target.value,
                      matchMode: FilterMatchMode.CONTAINS,
                    },
                  })
                }
                id="name"
                placeholder="...Search"
                className="w-full h-full border-1"
              />
            </span>
            <DataTable
              paginator
              filters={filters}
              rows={5}
              rowsPerPageOptions={[5, 10, 25, 50]}
              value={products}
              selectionMode={true}
              selection={selectedProducts}
              onSelectionChange={(e) => setSelectedProducts(e.value)}
              dataKey="api"
              className="w-full mt-4"
              tableStyle={{ minWidth: "50rem" }}
            >
              <Column
                selectionMode="multiple"
                headerStyle={{ width: "3rem" }}
              ></Column>
              <Column field="position" header="Position"></Column>
              <Column field="api" header="API"></Column>
              <Column field="domain" header="Domain"></Column>
              <Column field="javaWeight" header="Java"></Column>
              <Column field="csWeight" header="C#"></Column>
              <Column field="merged" header="Merged"></Column>
              <Column className="" body={updateBodyTemplate}></Column>
            </DataTable>
          </div>
        </div>
        <pre className="line-numbers">
          <code id="output" className="language-yaml"></code>
        </pre>
      </div>
      <DialogUpdate
        visible={visible}
        setVisible={setVisible}
        valueJava={valueJava}
        setValueJava={setValueJava}
        valueC={valueC}
        setValueC={setValueC}
        handleSubmit={handleSubmit}
        handleSubmitMore={handleSubmitMore}
        disable={disable}
        setDisable={setDisable}
        text={text}
      />
    </div>
  );
}
